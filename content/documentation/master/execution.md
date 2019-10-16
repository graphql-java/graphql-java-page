---
title: "Execution"
date: 2018-09-09T12:52:46+10:00
draft: false
tags: [documentation]
weight: 102
description: How to execute a query using the graphql-java engine
---
# Execution

## Queries

To execute a query against a schema, build a new ``GraphQL`` object with the appropriate arguments and then
call ``execute()``.

The result of a query is an ``ExecutionResult`` which is the query data and/or a list of errors.

{{< highlight java "linenos=table" >}}

        GraphQLSchema schema = GraphQLSchema.newSchema()
                .query(queryType)
                .build();

        GraphQL graphQL = GraphQL.newGraphQL(schema)
                .build();

        ExecutionInput executionInput = ExecutionInput.newExecutionInput().query("query { hero { name } }")
                .build();

        ExecutionResult executionResult = graphQL.execute(executionInput);

        Object data = executionResult.getData();
        List<GraphQLError> errors = executionResult.getErrors();


{{< / highlight >}}

More complex query examples can be found in the [StarWars query tests](https://github.com/graphql-java/graphql-java/blob/master/src/test/groovy/graphql/StarWarsQueryTest.groovy)

## Data Fetchers

Each graphql field type has a ``graphql.schema.DataFetcher`` associated with it.  Other graphql implementations often call this
type of code *resolvers**.

Often you can rely on ``graphql.schema.PropertyDataFetcher`` to examine Java POJO objects to
provide field values from them.  If your don't specify a data fetcher on a field, this is what will be used.

However you will need to fetch your top level domain objects via your own custom data fetchers.  This might involve making
a database call or contacting another system over HTTP say.

``graphql-java`` is not opinionated about how you get your domain data objects, that is very much your concern.  It is also not
opinionated on user authorisation to that data.  You should push all that logic into your business logic layer code.

A data fetcher might look like this:

{{< highlight java "linenos=table" >}}

        DataFetcher userDataFetcher = new DataFetcher() {
            @Override
            public Object get(DataFetchingEnvironment environment) {
                return fetchUserFromDatabase(environment.getArgument("userId"));
            }
        };

{{< / highlight >}}

Each ``DataFetcher`` is passed a ``graphql.schema.DataFetchingEnvironment`` object which contains what field is being fetched, what
arguments have been supplied to the field and other information such as the field's parent object, the query root object or the query
context object.

In the above example, the execution will wait for the data fetcher to return before moving on.  You can make execution of
the ``DataFetcher`` asynchronous by returning a ``CompletionStage`` to data, that is explained more further down this page.

## Exceptions while fetching data

If an exception happens during the data fetcher call, then the execution strategy by default will make a
``graphql.ExceptionWhileDataFetching`` error and add it to the list of errors on the result.  Remember graphql allows
partial results with errors.

Here is the code for the standard behaviour.

{{< highlight java "linenos=table" >}}

    public class SimpleDataFetcherExceptionHandler implements DataFetcherExceptionHandler {
        private static final Logger log = LoggerFactory.getLogger(SimpleDataFetcherExceptionHandler.class);

        @Override
        public void accept(DataFetcherExceptionHandlerParameters handlerParameters) {
            Throwable exception = handlerParameters.getException();
            SourceLocation sourceLocation = handlerParameters.getField().getSourceLocation();
            ExecutionPath path = handlerParameters.getPath();

            ExceptionWhileDataFetching error = new ExceptionWhileDataFetching(path, exception, sourceLocation);
            handlerParameters.getExecutionContext().addError(error);
            log.warn(error.getMessage(), exception);
        }
    }
{{< / highlight >}}

If the exception you throw is itself a `GraphqlError` then it will transfer the message and custom extensions attributes from that exception
into the `ExceptionWhileDataFetching` object.  This allows you to place your own custom attributes into the graphql error that is sent back
to the caller.

For example imagine your data fetcher threw this exception.  The `foo` and `fizz` attributes would be included in the resultant
graphql error.

{{< highlight java "linenos=table" >}}

    class CustomRuntimeException extends RuntimeException implements GraphQLError {
        @Override
        public Map<String, Object> getExtensions() {
            Map<String, Object> customAttributes = new LinkedHashMap<>();
            customAttributes.put("foo", "bar");
            customAttributes.put("fizz", "whizz");
            return customAttributes;
        }

        @Override
        public List<SourceLocation> getLocations() {
            return null;
        }

        @Override
        public ErrorType getErrorType() {
            return ErrorType.DataFetchingException;
        }
    }

{{< / highlight >}}


You can change this behaviour by creating your own ``graphql.execution.DataFetcherExceptionHandler`` exception handling code and
giving that to the execution strategy.

For example the code above records the underlying exception and stack trace.  Some people
may prefer not to see that in the output error list.  So you can use this mechanism to change that
behaviour.

{{< highlight java "linenos=table" >}}

        DataFetcherExceptionHandler handler = new DataFetcherExceptionHandler() {
            @Override
            public void accept(DataFetcherExceptionHandlerParameters handlerParameters) {
                //
                // do your custom handling here.  The parameters have all you need
            }
        };
        ExecutionStrategy executionStrategy = new AsyncExecutionStrategy(handler);

{{< / highlight >}}


## Returning data and errors

It is also possible to return both data and multiple errors in a ``DataFetcher`` implementation by returning
`graphql.execution.DataFetcherResult` either directly or wrapped in a ``CompletableFuture`` instance for asynchronous
execution.  This is a useful when your ``DataFetcher`` may need to retrieve data from multiple sources or from another
GraphQL resource.

In this example, the ``DataFetcher`` retrieves a user from another GraphQL resource and returns its data and errors.

{{< highlight java "linenos=table" >}}

        DataFetcher userDataFetcher = new DataFetcher() {
            @Override
            public Object get(DataFetchingEnvironment environment) {
                Map response = fetchUserFromRemoteGraphQLResource(environment.getArgument("userId"));
                List<GraphQLError> errors = response.get("errors")).stream()
                    .map(MyMapGraphQLError::new)
                    .collect(Collectors.toList();
                return new DataFetcherResult(response.get("data"), errors);
            }
        };

{{< / highlight >}}


## Serializing results to JSON

The most common way to call graphql is over HTTP and to expect a JSON response back.  So you need to turn an
`graphql.ExecutionResult` into a JSON payload.

A common way to do that is use a JSON serialisation library like Jackson or GSON.  However exactly how they interpret the
data result is particular to them.  For example `nulls` are important in graphql results and hence you must set up the json mappers
to include them.

To ensure you get a JSON result that conforms 100% to the graphql spec, you should call `toSpecification` on the result and then
send that back as JSON.

This will ensure that the result follows the specification outlined in https://graphql.github.io/graphql-spec/draft/#sec-Response


{{< highlight java "linenos=table" >}}
        ExecutionResult executionResult = graphQL.execute(executionInput);

        Map<String, Object> toSpecificationResult = executionResult.toSpecification();

        sendAsJson(toSpecificationResult);

{{< / highlight >}}




## Mutations

A good starting point to learn more about mutating data in graphql is http://graphql.org/learn/queries/#mutations 

In essence you need to define a ``GraphQLObjectType`` that takes arguments as input.  Those arguments are what you can use to mutate your data store
via the data fetcher invoked.

The mutation is invoked via a query like :

{{< highlight graphql "linenos=table" >}}

    mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
      createReview(episode: $ep, review: $review) {
        stars
        commentary
      }
    }

{{< / highlight >}}

You need to send in arguments during that mutation operation, in this case for the variables for ``$ep`` and ``$review``

You would create types like this to handle this mutation :

{{< highlight java "linenos=table" >}}

        GraphQLInputObjectType episodeType = newInputObject()
                .name("Episode")
                .field(newInputObjectField()
                        .name("episodeNumber")
                        .type(Scalars.GraphQLInt))
                .build();

        GraphQLInputObjectType reviewInputType = newInputObject()
                .name("ReviewInput")
                .field(newInputObjectField()
                        .name("stars")
                        .type(Scalars.GraphQLString)
                        .name("commentary")
                        .type(Scalars.GraphQLString))
                .build();

        GraphQLObjectType reviewType = newObject()
                .name("Review")
                .field(newFieldDefinition()
                        .name("stars")
                        .type(GraphQLString))
                .field(newFieldDefinition()
                        .name("commentary")
                        .type(GraphQLString))
                .build();

        GraphQLObjectType createReviewForEpisodeMutation = newObject()
                .name("CreateReviewForEpisodeMutation")
                .field(newFieldDefinition()
                        .name("createReview")
                        .type(reviewType)
                        .argument(newArgument()
                                .name("episode")
                                .type(episodeType)
                        )
                        .argument(newArgument()
                                .name("review")
                                .type(reviewInputType)
                        )
                )
                .build();

        GraphQLCodeRegistry codeRegistry = newCodeRegistry()
                .dataFetcher(
                        coordinates("CreateReviewForEpisodeMutation", "createReview"),
                        mutationDataFetcher()
                )
                .build();


        GraphQLSchema schema = GraphQLSchema.newSchema()
                .query(queryType)
                .mutation(createReviewForEpisodeMutation)
                .codeRegistry(codeRegistry)
                .build();

{{< / highlight >}}


Notice that the input arguments are of type ``GraphQLInputObjectType``.  This is important.  Input arguments can ONLY be of that type
and you cannot use output types such as ``GraphQLObjectType``.  Scalars types are consider both input and output types.

The data fetcher here is responsible for executing the mutation and returning some sensible output values.

{{< highlight java "linenos=table" >}}


    private DataFetcher mutationDataFetcher() {
        return new DataFetcher() {
            @Override
            public Review get(DataFetchingEnvironment environment) {
                //
                // The graphql specification dictates that input object arguments MUST
                // be maps.  You can convert them to POJOs inside the data fetcher if that
                // suits your code better
                //
                // See https://graphql.github.io/graphql-spec/draft/#sec-Input-Objects
                //
                Map<String, Object> episodeInputMap = environment.getArgument("episode");
                Map<String, Object> reviewInputMap = environment.getArgument("review");

                //
                // in this case we have type safe Java objects to call our backing code with
                //
                EpisodeInput episodeInput = EpisodeInput.fromMap(episodeInputMap);
                ReviewInput reviewInput = ReviewInput.fromMap(reviewInputMap);

                // make a call to your store to mutate your database
                Review updatedReview = reviewStore().update(episodeInput, reviewInput);

                // this returns a new view of the data
                return updatedReview;
            }
        };
    }
{{< / highlight >}}

Notice how it calls a data store to mutate the backing database and then returns a ``Review`` object that can be used as the output values
to the caller.

## Asynchronous Execution

graphql-java uses fully asynchronous execution techniques when it executes queries.  You can get the ``CompleteableFuture`` to results by calling
``executeAsync()`` like this

{{< highlight java "linenos=table" >}}
        GraphQL graphQL = buildSchema();

        ExecutionInput executionInput = ExecutionInput.newExecutionInput().query("query { hero { name } }")
                .build();

        CompletableFuture<ExecutionResult> promise = graphQL.executeAsync(executionInput);

        promise.thenAccept(executionResult -> {
            // here you might send back the results as JSON over HTTP
            encodeResultToJsonAndSendResponse(executionResult);
        });

        promise.join();

{{< / highlight >}}


The use of ``CompletableFuture`` allows you to compose actions and functions that will be applied when the execution completes.  The final
call to ``.join()`` waits for the execution to happen.

In fact under the covers, the graphql-java engine uses asynchronous execution and makes the ``.execute()`` method appear synchronous by
calling join for you.  So the following code is in fact the same.

{{< highlight java "linenos=table" >}}

        ExecutionResult executionResult = graphQL.execute(executionInput);

        // the above is equivalent to the following code (in long hand)

        CompletableFuture<ExecutionResult> promise = graphQL.executeAsync(executionInput);
        ExecutionResult executionResult2 = promise.join();

{{< / highlight >}}



If a ``graphql.schema.DataFetcher`` returns a ``CompletableFuture<T>`` object then this will be composed into the overall asynchronous
query execution.  This means you can fire off a number of field fetching requests in parallel.  Exactly what
threading strategy you use is up to your data fetcher code.

The following code uses the standard Java ``java.util.concurrent.ForkJoinPool.commonPool()`` thread executor to supply values in another
thread.

{{< highlight java "linenos=table" >}}

        DataFetcher userDataFetcher = new DataFetcher() {
            @Override
            public Object get(DataFetchingEnvironment environment) {
                CompletableFuture<User> userPromise = CompletableFuture.supplyAsync(() -> {
                    return fetchUserViaHttp(environment.getArgument("userId"));
                });
                return userPromise;
            }
        };


{{< / highlight >}}

The code above is written in long form.  With Java 8 lambdas it can be written more succinctly as follows

{{< highlight java "linenos=table" >}}

        DataFetcher userDataFetcher = environment -> CompletableFuture.supplyAsync(
                () -> fetchUserViaHttp(environment.getArgument("userId")));

{{< / highlight >}}

The graphql-java engine ensures that all the ``CompletableFuture`` objects are composed together to provide an execution result
that follows the graphql specification.

There is a helpful shortcut in graphql-java to create asynchronous data fetchers. 
Use ``graphql.schema.AsyncDataFetcher.async(DataFetcher<T>)`` to wrap a
``DataFetcher``. This can be used with static imports to produce more readable code.

{{< highlight java "linenos=table" >}}

        DataFetcher userDataFetcher = async(environment -> fetchUserViaHttp(environment.getArgument("userId")));

{{< / highlight >}}

## Execution Strategies

A class derived from ``graphql.execution.ExecutionStrategy`` is used to run a query or mutation.  A number of different
strategies are provided with graphql-java and if you are really keen you can even write your own.

You can wire in what execution strategy to use when you create the ``GraphQL`` object.


{{< highlight java "linenos=table" >}}

        GraphQL.newGraphQL(schema)
                .queryExecutionStrategy(new AsyncExecutionStrategy())
                .mutationExecutionStrategy(new AsyncSerialExecutionStrategy())
                .build();
{{< / highlight >}}

In fact the code above is equivalent to the default settings and is a very sensible choice of execution
strategies for most cases.

## AsyncExecutionStrategy

By default the "query" execution strategy is ``graphql.execution.AsyncExecutionStrategy`` which will dispatch
each field as ``CompleteableFuture`` objects and not care which ones complete first.  This strategy allows for the most
performant execution.

The data fetchers invoked can themselves return ``CompletionStage`` values and this will create
fully asynchronous behaviour.

So imagine a query as follows

{{< highlight graphql "linenos=table" >}}

    query {
      hero {
        enemies {
          name
        }
        friends {
          name
        }
      }
    }
{{< / highlight >}}



The ``AsyncExecutionStrategy`` is free to dispatch the *enemies* field at the same time as the *friends* field.  It does not
have to do *enemies* first followed by *friends*, which would be less efficient.

It will however assemble the results in order.  The query result will follow the graphql specification and return object values
assembled in query field order.  Only the execution of data fetching is free to be in any order.

This behaviour is allowed in the graphql specification and in fact is actively encouraged https://graphql.github.io/graphql-spec/draft/#sec-Query
for read only queries.

See `specification <https://graphql.github.io/graphql-spec/draft/#sec-Normal-and-Serial-Execution>` for details.


## AsyncSerialExecutionStrategy

The graphql specification says that mutations MUST be executed serially and in the order in which the
query fields occur.

So ``graphql.execution.AsyncSerialExecutionStrategy`` is used by default for mutations and will ensure that each
field is completed before it processes the next one and so forth.  You can still return ``CompletionStage`` objects
in the mutation data fetchers, however they will be executed serially and will be completed before the next
mutation field data fetcher is dispatched.

## SubscriptionExecutionStrategy

Graphql subscriptions allows you to create stateful subscriptions to graphql data.  You uses ``SubscriptionExecutionStrategy``
as your execution strategy as it has the support for the reactive-streams APIs.

See http://www.reactive-streams.org/ for more information on the reactive ``Publisher`` and ``Subscriber`` interfaces.

Also see the page on [subscriptions](../subscriptions) for more details on how to write a subscription based graphql service.


## Query Caching

Before the ``graphql-java`` engine executes a query it must be parsed and validated, and this process can be somewhat time consuming.

To avoid the need for re-parse/validate the ``GraphQL.Builder`` allows an instance of ``PreparsedDocumentProvider`` to reuse ``Document`` instances.

Please note that this does not cache the result of the query, only the parsed ``Document``.

{{< highlight java "linenos=table" >}}
    Cache<String, PreparsedDocumentEntry> cache = Caffeine.newBuilder().maximumSize(10_000).build(); (1)
    GraphQL graphQL = GraphQL.newGraphQL(StarWarsSchema.starWarsSchema)
            .preparsedDocumentProvider(cache::get) (2)
            .build();

{{< / highlight >}}


1. Create an instance of preferred cache instance, here is `Caffeine <https://github.com/ben-manes/caffeine>`_  used as it is a high quality caching solution. The cache instance should be thread safe and shared.
2. The ``PreparsedDocumentProvider`` is a functional interface with only a get method and we can therefore pass a method reference that matches the signature into the builder.


In order to achieve high cache hit ration it is recommended that field arguments are passed in as variables instead of directly in the query.

The following query:

{{< highlight graphql "linenos=table" >}}
    query HelloTo {
         sayHello(to: "Me") {
            greeting
         }
    }


{{< / highlight >}}

Should be rewritten as:

{{< highlight graphql "linenos=table" >}}
    query HelloTo($to: String!) {
         sayHello(to: $to) {
            greeting
         }
    }

{{< / highlight >}}


with variables:

{{< highlight json "linenos=table" >}}
    {
       "to": "Me"
    }

{{< / highlight >}}


The query is now reused regardless of variable values provided.

