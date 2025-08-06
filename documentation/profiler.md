---
title: "Profiling requests"
date: 2025-08-05T12:52:46+10:00
---

# Profiling GraphQL requests

We've introduced a new profiling feature to help you understand the performance of your GraphQL executions. It provides detailed insights into DataFetcher calls, Dataloader usage, and execution timing. This guide will show you how to use it and interpret the results.

The Profiler is available in all versions after v25.0.beta-5. It will also be included in the forthcoming official v25.0 release.

## Enabling the Profiler

To enable profiling for a GraphQL execution, you need to set a flag on your `ExecutionInput`. It's as simple as calling `.profileExecution(true)` when building it.

```java
import graphql.ExecutionInput;
import graphql.GraphQL;

// ...
GraphQL graphql = GraphQL.newGraphQL(schema).build();

ExecutionInput executionInput = ExecutionInput.newExecutionInput()
        .query("query Hello { world }")
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
    Map<String, Object> summary = profilerResult.shortSummaryMap();
    System.out.println(summary); // or log as you prefer
}
```

## Understanding the Profiler Results

A great way to get a quick overview about `ProfilerResult` is by using the `shortSummaryMap()` method. It returns a map with key metrics about the execution, which you can use for logging. Let's break down what each key means.

### The ProfilerResult Short Summary Map

Here's a detailed explanation of the fields you'll find in the map returned by `shortSummaryMap()`:

| Key                                   | Type        | Description                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ----------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `executionId`                         | `String`    | The unique ID for this GraphQL execution.                                                                                                                                                                                                                                                |
| `operationName`                       | `String`    | The name of the operation, if one was provided in the query (e.g., `query MyQuery { ... }`).                                                                                                                                                                                             |
| `operationType`                       | `String`    | The type of operation, such as `QUERY`, `MUTATION`, or `SUBSCRIPTION`.                                                                                                                                                                                                                   |
| `startTimeNs`                         | `long`      | The system time in nanoseconds when the execution started.                                                                                                                                                                                                                               |
| `endTimeNs`                           | `long`      | The system time in nanoseconds when the execution finished.                                                                                                                                                                                                                              |
| `totalRunTimeNs`                      | `long`      | The total wall-clock time of the execution (`endTimeNs - startTimeNs`). This includes time spent waiting for asynchronous operations like database calls or external API requests within your DataFetchers.                                                                              |
| `engineTotalRunningTimeNs`            | `long`      | The total time the GraphQL engine spent actively running on a thread. This is like the "CPU time" of the execution and excludes time spent waiting for `CompletableFuture`s to complete. Comparing this with `totalRunTimeNs` can give you a good idea of how much time is spent on I/O. |
| `totalDataFetcherInvocations`         | `int`       | The total number of times any DataFetcher was invoked.                                                                                                                                                                                                                                   |
| `totalCustomDataFetcherInvocations`   | `int`       | The number of invocations for DataFetchers you've written yourself (i.e., not the built-in `PropertyDataFetcher`).                                                                                                                                                                       |
| `totalTrivialDataFetcherInvocations`  | `int`       | The number of invocations for the built-in `PropertyDataFetcher`.                                                                                                                                                                                                                        |
| `totalWrappedTrivialDataFetcherInvocations` | `int` | The number of invocations for DataFetchers that wrap a `PropertyDataFetcher`.                                                                                                                                                                                                            |
| `fieldsFetchedCount`                  | `int`       | The number of unique fields fetched during the execution.                                                                                                                                                                                                                                |
| `dataLoaderChainingEnabled`           | `boolean`   | `true` if the experimental Dataloader chaining feature was enabled for this execution.                                                                                                                                                                                                   |
| `dataLoaderLoadInvocations`           | `Map`       | A map where keys are Dataloader names and values are the number of times `load()` was called on them. Note that this counts all `load()` calls, including those that hit the Dataloader cache.                                                                                           |
| `oldStrategyDispatchingAll`           | `Set`       | If Chained DataLoaders are not used, the older dispatching strategy is used instead. This key lists the levels where DataLoaders were dispatched.                                                                                                                                        |
| `dispatchEvents`                      | `List<Map>` | A list of events, one for each time a Dataloader was dispatched. See below for details.                                                                                                                                                                                                  |
| `instrumentationClasses`              | `List<String>` | A list of the class names of the `Instrumentation`s used during this execution.                                                                                                                                                                                          |
| `dataFetcherResultTypes`              | `Map`       | A summary of the types of values returned by your custom DataFetchers. See below for details.                                                                                                                                                                                            |

#### `dispatchEvents`

This is a list of maps, each detailing a `DataLoader` dispatch event.

| Key            | Type     | Description                                                          |
| -------------- | -------- | -------------------------------------------------------------------- |
| `type`         | `String` | The type of dispatch. Can be `LEVEL_STRATEGY_DISPATCH`, `CHAINED_STRATEGY_DISPATCH`, `DELAYED_DISPATCH`, `CHAINED_DELAYED_DISPATCH`, or `MANUAL_DISPATCH`. |
| `dataLoader`   | `String` | The name of the `DataLoader` that was dispatched.                      |
| `level`        | `int`    | The execution strategy level at which the dispatch occurred.         |
| `keyCount`     | `int`    | The number of keys that were dispatched in this batch.                 |

#### `dataFetcherResultTypes`

This map gives you more information into the type of your DataFetchers' return values.

The keys are `COMPLETABLE_FUTURE_COMPLETED`, `COMPLETABLE_FUTURE_NOT_COMPLETED`, and `MATERIALIZED`.
Each key maps to another map with two keys:
*   `count`: The number of unique fields with DataFetchers that returned this result type.
*   `invocations`: The total number of invocations across all fields that returned this result type.

Here's what the result types mean:

| Result Type                        | Meaning                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `COMPLETABLE_FUTURE_COMPLETED`     | The DataFetcher returned a `CompletableFuture` that was already completed when it was returned. |
| `COMPLETABLE_FUTURE_NOT_COMPLETED` | The DataFetcher returned an incomplete `CompletableFuture`.    |
| `MATERIALIZED`                     | The DataFetcher returned a simple value (i.e., not a `CompletableFuture`).                   |

### A note on engine timing statistics logged from an `Instrumentation`

If you're logging the `ProfilerResult` from an `Instrumentation`, note that engine timing statistics such as `startTimeNs`, `endTimeNs`, `totalRunTimeNs`, `engineTotalRunningTimeNs` will be set to `0`. This is because the timing is set after all `Instrumentation`s have run, so it is not available from within an `Instrumentation`.

Apart from engine timing information, all other `ProfilerResult` information is still valid if accessed from within an `Instrumentation`.
