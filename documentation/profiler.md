---
title: "Profiling requests"
date: 2025-08-05T12:52:46+10:00
description: How to avoid the dreaded N+1 calls for data and make your graphql system more efficient
---

# Profiling GraphQL requests

We've introduced a new query profiling feature to help you understand the performance characteristics of your GraphQL executions. It provides detailed insights into data fetcher calls, data loader usage, and execution timing. This guide will show you how to use it and interpret the results.

The Profiler is available in all versions after v25.0.beta-5. If you're not using a beta version, it will be included in the official v25.0 release.

## Enabling the Profiler

To enable profiling for a GraphQL execution, you need to set a flag on your `ExecutionInput`. It's as simple as calling `.profileExecution(true)` when building it.

```java
import graphql.ExecutionInput;
import graphql.GraphQL;

// ...
GraphQL graphql = GraphQL.newGraphQL(schema).build();

ExecutionInput executionInput = ExecutionInput.newExecutionInput()
        .query("{ hello }")
        .profileExecution(true) // Enable profiling
        .build();

graphql.execute(executionInput);
```

## Accessing the Profiler Results

The profiling results are stored in the `GraphQLContext` associated with your `ExecutionInput`. After the execution is complete, you can retrieve the `ProfilerResult` object from the context.

The result object is stored under the key `ProfilerResult.PROFILER_CONTEXT_KEY`.

```java
import graphql.ExecutionInput;
import graphql.ExecutionResult;
import graphql.GraphQL;
import graphql.ProfilerResult;

// ...
ExecutionInput executionInput = /* ... see above ... */
ExecutionResult executionResult = graphql.execute(executionInput);

ProfilerResult profilerResult = executionInput.getGraphQLContext().get(ProfilerResult.PROFILER_CONTEXT_KEY);

if (profilerResult != null) {
    // You now have access to the profiling data
    Map<String, Object> summary = profilerResult.shortSummaryMap();
    System.out.println(summary);
}
```

## Understanding the Profiler Results

The `ProfilerResult` object contains a wealth of information. A great way to get a quick overview is by using the `shortSummaryMap()` method. It returns a map with key metrics about the execution. Let's break down what each key means.

### The Short Summary Map

Here's a detailed explanation of the fields you'll find in the map returned by `shortSummaryMap()`:

| Key                                   | Type        | Description                                                                                                                                                                                             |
| ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `executionId`                         | `String`    | The unique ID for this GraphQL execution.                                                                                                                                                               |
| `operationName`                       | `String`    | The name of the operation, if one was provided in the query (e.g., `query MyQuery { ... }`).                                                                                                            |
| `operationType`                       | `String`    | The type of operation, such as `QUERY`, `MUTATION`, or `SUBSCRIPTION`.                                                                                                                                  |
| `startTimeNs`                         | `long`      | The system monotonic time in nanoseconds when the execution started.                                                                                                                                    |
| `endTimeNs`                           | `long`      | The system monotonic time in nanoseconds when the execution finished.                                                                                                                                   |
| `totalRunTimeNs`                      | `long`      | The total wall-clock time of the execution (`endTimeNs - startTimeNs`). This includes time spent waiting for asynchronous operations like database calls or external API requests within your data fetchers. |
| `engineTotalRunningTimeNs`            | `long`      | The total time the GraphQL engine spent actively running on a thread. This is like the "CPU time" of the execution and excludes time spent waiting for `CompletableFuture`s to complete. Comparing this with `totalRunTimeNs` can give you a good idea of how much time is spent on I/O. |
| `totalDataFetcherInvocations`         | `int`       | The total number of times any data fetcher was invoked.                                                                                                                                                   |
| `totalCustomDataFetcherInvocations`   | `int`       | The number of invocations for data fetchers you've written yourself (i.e., not the built-in `PropertyDataFetcher`). This is often the most interesting data fetcher metric. |
| `totalTrivialDataFetcherInvocations`  | `int`       | The number of invocations for the built-in `PropertyDataFetcher`, which simply retrieves a property from a POJO.                                                                                       |
| `totalWrappedTrivialDataFetcherInvocations` | `int` | The number of invocations for data fetchers that wrap a `PropertyDataFetcher`. This usually happens when you use instrumentation to wrap data fetchers.                                              |
| `fieldsFetchedCount`                  | `int`       | The number of unique fields fetched during the execution.                                                                                                                                               |
| `dataLoaderChainingEnabled`           | `boolean`   | `true` if the experimental data loader chaining feature was enabled for this execution.                                                                                                               |
| `dataLoaderLoadInvocations`           | `Map`       | A map where keys are data loader names and values are the number of times `load()` was called on them. Note that this counts all `load()` calls, including those that hit the data loader cache.        |
| `oldStrategyDispatchingAll`           | `Set`       | An advanced metric related to an older data loader dispatching strategy. It contains the execution levels where all data loaders were dispatched at once.                                                |
| `dispatchEvents`                      | `List<Map>` | A list of events, one for each time a data loader was dispatched. See below for details.                                                                                                                |
| `instrumentationClasses`              | `List<String>` | A list of the fully qualified class names of the `Instrumentation` implementations used during this execution.                                                                                      |
| `dataFetcherResultTypes`              | `Map`       | A summary of the types of values returned by your custom data fetchers. See below for details.                                                                                                        |

#### `dispatchEvents`

This is a list of maps, each detailing a `DataLoader` dispatch event.

| Key            | Type     | Description                                                          |
| -------------- | -------- | -------------------------------------------------------------------- |
| `type`         | `String` | The type of dispatch. Can be `LEVEL_STRATEGY_DISPATCH`, `CHAINED_STRATEGY_DISPATCH`, `DELAYED_DISPATCH`, `CHAINED_DELAYED_DISPATCH`, or `MANUAL_DISPATCH`. |
| `dataLoader`   | `String` | The name of the `DataLoader` that was dispatched.                      |
| `level`        | `int`    | The execution strategy level at which the dispatch occurred.         |
| `keyCount`     | `int`    | The number of keys that were dispatched in this batch.                 |

#### `dataFetcherResultTypes`

This map gives you insight into the nature of your data fetchers' return values. This is especially useful for understanding the asynchronous behavior of your schema.

The keys are `COMPLETABLE_FUTURE_COMPLETED`, `COMPLETABLE_FUTURE_NOT_COMPLETED`, and `MATERIALIZED`.
Each key maps to another map with two keys:
*   `count`: The number of unique fields with data fetchers that returned this result type.
*   `invocations`: The total number of invocations across all fields that returned this result type.

Here's what the result types mean:

| Result Type                        | Meaning                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `COMPLETABLE_FUTURE_COMPLETED`     | The data fetcher returned a `CompletableFuture` that was already completed when it was returned. |
| `COMPLETABLE_FUTURE_NOT_COMPLETED` | The data fetcher returned an incomplete `CompletableFuture`, indicating asynchronous work.    |
| `MATERIALIZED`                     | The data fetcher returned a simple value (i.e., not a `CompletableFuture`).                   |
