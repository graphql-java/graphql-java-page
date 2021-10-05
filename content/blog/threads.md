+++
title = "GraphQL Java and Threads"
author = "Andreas Marek"
tags = []
categories = []
date = 2021-02-05T00:00:00+10:00
+++

# GraphQL Java and Threads

We follow a fundamental rule in GraphQL Java regarding Threads: GraphQL Java never creates 
Threads or interacts with Thread pools. We do this because we want to give the user the full control 
and whatever GraphQL Java would do, it would not be correct for every use case.

Additionally to being strictly unopinionated regarding Threads, GraphQL Java is also fully reactive, 
implemented via `CompletableFuture` (`CF`).
These two constrain together mean we rely on the `CF` returned by the user. 
Specifically we piggyback on the `CF` returned by the `DataFetcher` 
(or other async methods which can be implemented by the user, but we focus here on `DataFetcher` 
as it is by far the most important).


{{< highlight Java "linenos=table" >}}
    // Pseudo code in GraphQL Java
    
    CompletableFuture<Object> dataFetcherResult = invokeDataFetcher();
    dataFetcherResult.thenApply(result -> {
        // in which Thread  where this code happens is controlled by the CF returned
        continueExecutingQuery(result);
    });

{{< / highlight >}}
<p/>

# Blocking DataFetcher

Lets assume you are accessing a DB in a blocking way in your `DataFetcher`:

{{< highlight Java "linenos=table" >}}
    String get(DataFetchingEnvironment env) {
        return getValueFromDb(env); // blocking the Thread until the value is read from DB
    };
{{< / highlight >}}
<p/>

This is not completely wrong, but not recommend in general as the consequence of this kind of `DataFecher`
is that GraphQL can't execute the query in the most efficient way.

For example for the following query: 

{{< highlight Scala "linenos=table" >}}
{
    dbData1
    dbData2
    dbData3
}
{{< / highlight >}}
<p/>

If the `DataFetcher` for these `dbData` fields don't return a `CF`,
but block the Thread until the data is read, GraphQL Java will not work with maximum efficiency.

GraphQL Java can invoke the `DataFetcher` for all three fields in parallel. But if your `DataFetcher` for
`dbData1` is blocking, GraphQL Java will also be blocked and only invoke the next `DataFetcher` once `dbData<n>` 
is finished. 
The recommend solution to this problem is offloading your blocking code onto a separate Thread pool 
as shown here: 

{{< highlight Java "linenos=table" >}}
    CompletableFuture<String> get(DataFetchingEnvironment env) {
        return CompletableFuture.supplyAsync( getValueFromDb(env), dbThreadPool ); 
    };
{{< / highlight >}}
<p/>
This code will maximize the performance and will cause all three fields to be fetched in parallel.

# Different pools for different work

The subsequent work done by GraphQL Java will be executed in the same `dbThreadPool` until it 
encounters a new `DataFetcher` returned by the user code and this new `CF` dedicates the Thread 
for the subsequent work. 

If you want to have separate pools for different kind of work, one for the actual `DataFetcher` which normally
involve IO and one of the actual GraphQL Java work (which is pure CPU), you need to switch back from your offloaded
pool to a dedicated GraphQL Java pool before returning the `CF`. You can achieve this with code like this:

{{< highlight Java "linenos=table" >}}
    CompletableFuture<String> get(DataFetchingEnvironment env) {
        return CompletableFuture.supplyAsync( getValueFromDb(env), dbThreadPool )
            .handleAsync((result,exception) -> {
                if(exception !=null) throw exception;
                return result;
            }, graphqlJavaPool); 
    };
{{< / highlight >}}
<p/>

Notice the `.handleAsync` which doesn't do anything except forwarding the result, but on a 
different pool (`graphqlJavaPool`).

This way you have different pools for different kind of work (one for CPU bound GraphQL Java work and one
for multiple ones for IO bound work), which can be configured and monitored independently.

# In a fully reactive system
If your system is fully reactive your `DataFetcher` will more look like this

{{< highlight Java "linenos=table" >}}
    CompletableFuture<String> get(DataFetchingEnvironment env) {
        return callAnotherServiceNonBlocking(env); // returns CompletableFuture
    };
{{< / highlight >}}
<p/>

The code above could be implemented via [Async Http Client](https://github.com/AsyncHttpClient/async-http-client)
or [WebFlux WebClient](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html#webflux-client).
Both provide fully reactive HTTP clients.

Because the code is non blocking there is no need to offload anything on a dedicated Thread pool to avoid blocking
GraphQL Java.

You still might want to consider using a dedicated GraphQL Java pool as you otherwise would use 
Threads which are dedicated to IO. How much this is really relevant depends highly on your use case.

For example `Async Http Client` (`AHC`) uses by default 2 * #cores (this value comes actually from Netty) Threads. If you 
don't use a dedicated Thread Pool for GraphQL Java you might encounter situations under load where all `AHC` 
Threads are either busy or blocked by GraphQL Java code and as a result your system is not as performant as it 
could be. Normally only load tests in production like environments can show the relevance of different Thread pools.


# Feedback or questions
We use [GitHub Discussions](https://github.com/graphql-java/graphql-java/discussions) for general feedback and questions.





