---
title: "Upgrade notes"
date: 2024-12-28T12:52:46+10:00
description: Miscellaneous notes to assist with upgrading GraphQL Java versions
---
# Upgrade notes

This is a special page with extra information to help with upgrading to a newer version of GraphQL Java, based on feedback from GitHub Discussion threads.

See detailed [release notes on GitHub](https://github.com/graphql-java/graphql-java/releases).

## Stricter requirements for scalar parseValue coercion in Version 22.0

### What changed?
In v22.0, `parseValue` coercion was made stricter to align with the reference JS implementation. This change applied to String, Boolean, Float, and Int.

* String `parseValue` now requires input of type String. For example, a Number input 123 or a Boolean input true will no longer be accepted.
* Boolean `parseValue` now requires input of type Boolean. For example, a String input "true" will no longer be accepted.
* Float `parseValue` now requires input of type Number. For example, a String input "3.14" will no longer be accepted.
* Int `parseValue` now requires input of type Number. For example, a String input "42" will no longer be accepted.

If you are upgrading from an earlier version of GraphQL Java and you see an error message such as `Expected a value that can be converted to type 'Int' but it was a 'String'`, it's because of this change in `parseValue` behavior for scalars.

See the [v22.0 release notes](https://github.com/graphql-java/graphql-java/releases/tag/v22.0) on GitHub.

### How do I upgrade?

As called out in the release notes, this is a breaking change.

You have two options:
1. Migrate: Use `InputInterceptor` introduced in [version 21.0](https://github.com/graphql-java/graphql-java/releases/tag/v21.0) to monitor incoming traffic, and after a period of time, migrate to the stricter `parseValue` coercion in version 22.0
2. Revert to legacy behavior: Use `InputInterceptor` to permanently use the older, less strict `parseValue` coercion, and keep things as they were before version 22.0

We'll leave the choice up to you. Here's how to implement each option.

The `InputInterceptor` interface allows you to monitor and/or modify input values, and an implementation is provided in `LegacyCoercingInputInterceptor`.

### How to use the InputInterceptor to monitor traffic

You can use the `LegacyCoercingInputInterceptor` implementation to monitor traffic. You can use the method `observeValues` to monitor incoming requests. When a legacy value is detected, a callback will be invoked. For example, the callback could be emitting a metric. To enable this observer, add it to `GraphQLContext`, for example:

```java
InputInterceptor legacyInputInterceptor = LegacyCoercingInputInterceptor.observesValues((inputValue, graphQLInputType) -> {
    emitAMetric(inputValue, graphQLInputType);
});

ExecutionInput executionInput = ExecutionInput.newExecutionInput()
        .query("query { exampleField }")
        .graphQLContext(Map.of(InputInterceptor.class, legacyInputInterceptor))
        .build();
```

### How to use the InputInterceptor to use the legacy parseValue behaviour (prior to v22.0)

You can alternatively use the `LegacyCoercingInputInterceptor` to revert to the legacy `parseValue` behavior, as it was prior to v22.0. The legacy behavior is implemented in the `migratesValues` method. To enable legacy behavior, add it to `GraphQLContext`, for example:

```java
ExecutionInput executionInput = ExecutionInput.newExecutionInput()
        .query("query { exampleField }")
        .graphQLContext(Map.of(InputInterceptor.class, LegacyCoercingInputInterceptor.migratesValues()))
        .build();
```
