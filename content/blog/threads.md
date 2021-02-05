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
and whatever GraphQL Java would do it would not be correct in general.

Additionally to being strictly unopinionated regarding Threads GraphQL Java is also fully reactive, 
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

So for example lets assume your `DataFetcher` access a DB (blocking, not reactive) and you decide 
to offload this work to a dedicated Thread pool: 

{{< highlight Java "linenos=table" >}}
    CompletableFuture<String> get(DataFetchingEnvironment env) {
        return dbAccess.supplyAsync( getValueFromDb(env), dbThreadPool ); 
    };
{{< / highlight >}}
<p/>

The subsequent work done by GraphQL Java will be executed in the same `dbThreadPool` until it 
encounters a new `DataFetcher` returned by the user code and this new `CF` dedicates the Thread 
for the subsequent work.

In general offloading your work to a dedicated Thread pool is recommend if your `DataFetcher` is blocking,
because otherwise GraphQL will not execute with maximal efficiency. 
For example for the following query: 

{{< highlight Scala "linenos=table" >}}
{
    field1
    field2
    field3
}
{{< / highlight >}}
<p/>
 
GraphQL can invoke the `DataFetcher` for all three fields in parallel. But if your `DataFetcher` for
`field1` is blocking GraphQL Java will also be blocked and only invoke the next `DataFetcher` once `field` 
is finished. Offloading your blocking code onto a separate Thread pool a shown above solves this problem.

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

Because the code is non blocking there is no need to offload anything on a dedicated Thread pool and
GraphQL Java "automatically" works as efficiently as possible.

# Feedback or questions
We use [GitHub discussions](https://github.com/graphql-java/graphql-java/discussions) for general feedback and questions.

You can also checkout our [Workshops](/workshops) for more possibilities to learn GraphQL Java.




