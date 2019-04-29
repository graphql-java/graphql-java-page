+++
title = "graphql-java - In Depth - Part 1: DataFetcherResult"
author = "Brad Baker"
tags = []
categories = []
date = 2019-04-11T00:00:00+10:00
+++

# DataFetcherResult

Today we are looking into the `graphql.execution.DataFetcherResult` object.

# The scenario

But first lets set the scene. Imagine we have a system that can return `issues` and the `comments` on those `issues`


{{< highlight Scala "linenos=table" >}}
{
  issues {
    key
    summary
    comments {
        text
    }
}
{{< / highlight >}}

<p/>

Nominally we would have a `graphql.schema.DataFetcher` on `issues` that returns a list of issues and one on the field `comments` that returns the list of comments
for each issue `source` object.

As you can see this naively creates an N+1 problem where we need to fetch data multiple times, one for each `issue` object in isolation.

We could attack this using the `org.dataloader.DataLoader` pattern but there is another way which will discuss in this article.

# Look ahead

The data fetcher behind the `issues` field is able to look ahead and see what sub fields are being asked for.  In this case it knows that `comments` are being asked 
for and hence it could prefetch them at the same time.

`graphql.schema.DataFetchingEnvironment#getSelectionSet` can be used by data fetcher code to get the selection set of fields for a given parent field.

{{< highlight Java "linenos=table" >}}
        DataFetcher issueDataFetcher = environment -> {
            DataFetchingFieldSelectionSet selectionSet = environment.getSelectionSet();
            if (selectionSet.contains("comments")) {
                List<IssueAndCommentsDTO> data = getAllIssuesWithComments(environment, selectionSet.getFields());
                return data;
            } else {
                List<IssueDTO> issues = getAllIssuesWitNoComments(environment);
                return issues;
            }
        };
{{< / highlight >}}

Imagine this is backed by an SQL system we might be able to use this field look ahead to produce the following SQL

{{< highlight Sql "linenos=table" >}}
    SELECT Issues.Key, Issues.Summary, Comments.Text
    FROM Issues
    INNER JOIN Comments ON Issues.CommentID=Comments.ID;
{{< / highlight >}}

So we have looked ahead and returned different data depending on the field sub selection.  We have made our system more efficient by using look ahead
to fetch data just the `1` time and not `N+1` times.

# Code Challenges

The challenge with this code design is that the shapes of the returned data is now field sub selection specific.  We needed a `IssueAndCommentsDTO` for one sub selection
path and a simpler `IssueDTO` for another path.

With enough paths this becomes problematic as it adds new DTO classes per path and makes out child data fetchers more complex

Also the standard graphql pattern is that the returned object becomes the `source` ie. `graphql.schema.DataFetchingEnvironment#getSource` of the next child 
data fetcher.  But we might have pre fetched data that is needed 2 levels deep and this is challenging to do since each data fetcher would need to capture and copy 
that data down to the layers below via new TDOs classes per level.  


# Passing Data and Local Context

GraphQL Java offers a capability that helps with this pattern.  GraphQL Java goes beyond what the reference graphql-js system gives you where the object you 
returned is automatically the `source` of the next child fetcher and that's all it can be.

In GraphQL Java you can use well known `graphql.execution.DataFetcherResult` to return three sets of values

* `data`  - which will be used as the source on the next set of sub fields
* `errors` - allowing you to return data as well as errors
* `localContext` - which allows you to pass down field specific context

When the engine sees the `graphql.execution.DataFetcherResult` object, it automatically unpacks it and handles it three classes of data in specific ways.

In our example case we will be use `data` and `localContext` to communicate between fields easily.

{{< highlight Java "linenos=table" >}}

DataFetcher issueDataFetcher = environment -> {
        DataFetchingFieldSelectionSet selectionSet = environment.getSelectionSet();
            if (selectionSet.contains("comments")) {
                List<IssueAndCommentsDTO> data = getAllIssuesWithComments(environment, selectionSet.getFields());

                List<IssueDTO> issues = data.stream().map(dto -> dto.getIssue()).collect(toList());

                Map<IssueDTO, List<CommentDTO>> preFetchedComments = mkMapOfComments(data);

                return DataFetcherResult.newResult()
                        .data(issues)
                        .localContext(preFetchedComments)
                        .build();
            } else {
                List<IssueDTO> issues = getAllIssuesWitNoComments(environment);
                return DataFetcherResult.newResult()
                        .data(issues)
                        .build();
            }
        };
{{< / highlight >}}

If you look now you will see that our data fetcher returns a `DataFetcherResult` object that contains `data` for the child data fetchers which is the 
list of `issueDTO` objects as per usual.  It will be their `source` object when they run.

It also passes down field specific `localContext` which is the pre-fetched comment data.

Unlike the global context object, local context objects are passed down from a specific field to its children and are not shared across to peer fields.  This means
a parent field has a "back channel" to talk to the child fields without having to "pollute" the DTO source objects with that information and it is "local" in the sense
that it given only to this field and its children and not any other field in the query.

Now lets look at the `comments` data fetcher and how it consumes this back channel of data


{{< highlight Java "linenos=table" >}}

        DataFetcher commentsDataFetcher = environment -> {
            IssueDTO issueDTO = environment.getSource();
            Map<IssueDTO, List<CommentDTO>> preFetchedComments = environment.getLocalContext();
            List<CommentDTO> commentDTOS = preFetchedComments.get(issueDTO);
            return DataFetcherResult.newResult()
                    .data(commentDTOS)
                    .localContext(preFetchedComments)
                    .build();
        };
{{< / highlight >}}

Notice how it got the `issueDTO` as its source object as expected but it also got a local context object which is our pre-fetched comments.  It can choose
to pass on new local context OR if it passes nothing then the previous value will bubble down to the next lot of child fields.  So you can think of `localContext`
as being inherited unless a fields data fetcher explicitly overrides it.  

Our data fetcher is a bit more complex because of the data pre-fetching but 'localContext' allows us a nice back channel to pass data without modifying our DTO objects
that are being used in more simple data fetchers.


# Passing back Errors or Data or Both

For completeness we will show you that you can also pass down errors or data or local context or all of them at once.

It is perfectly valid to fetch data in graphql and to ALSO send back errors.  Its not common but its valid. Some data is better than no data.

{{< highlight Java "linenos=table" >}}

    GraphQLError error = mkSpecialError("Its Tuesday");

    return DataFetcherResult.newResult()
            .data(commentDTOS)
            .error(error)
            .build();

{{< / highlight >}}

 



