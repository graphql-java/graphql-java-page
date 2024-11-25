---
title: "Limits"
date: 2024-11-24T10:00:00+10:00
description: Configuring limits to prevent DoS attacks
---
# Limits in graphql-java to Prevent DoS Attacks

graphql-java provides configurable options to limit the potential for Denial of Service (DoS) attacks through excessive query complexity or size. Defaults for all these limits have been already set.

## Parser Level Limits
At the parser level, graphql-java offers several options to restrict the amount of work the query parser will perform. See `graphql.parser.ParserOptions`.

**Maximum Query Characters:** Limits the number of characters in a query to prevent excessive parsing time and memory usage. The default is set to 1MB.

```java
public static final int MAX_QUERY_CHARACTERS = 1024 * 1024; // 1 MB
```

**Maximum Query Tokens:** Restricts the number of tokens in a query to prevent excessive CPU usage. The default is set to 15,000 tokens.

```java
public static final int MAX_QUERY_TOKENS = 15_000;
```

**Maximum Whitespace Tokens:** Limits the amount of whitespace in a query to prevent unnecessary parsing overhead. The default is set to 200,000 whitespace tokens.

```java
public static final int MAX_WHITESPACE_TOKENS = 200_000;
```

**Maximum Rule Depth:** Restricts the depth of grammar rules in a query to prevent stack overflow exceptions. The default is set to 500.

```java
public static final int MAX_RULE_DEPTH = 500;
```

## Introspection Query Limits
graphql-java includes measures to limit introspection queries:

**GoodFaithIntrospection:** Ensures introspection queries remain under a reasonable size.

```java
public static final int GOOD_FAITH_MAX_FIELDS_COUNT = 500;
public static final int GOOD_FAITH_MAX_DEPTH_COUNT = 20;
```

## Instrumentation
Beyond parser level limits, graphql-java provides instrumentation to manage query complexity:

**MaxQueryComplexityInstrumentation:** Limits the complexity of a query to prevent excessive resource usage. [See example on the Instrumentation page](/documentation/master/instrumentation#query-complexity-instrumentation).

**MaxQueryDepthInstrumentation:** Limits the depth of a query to prevent overly complex queries. [See example on the Instrumentation page](/documentation/master/instrumentation#query-depth-instrumentation)
