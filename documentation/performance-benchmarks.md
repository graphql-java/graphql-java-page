---
title: "Performance benchmarks"
date: 2024-03-08
description: Explaining performance benchmark methodology for GraphQL Java
---
# Performance benchmarks

## Why we benchmark performance

We care about the performance of GraphQL Java, and we want to make sure the library continues to be fast and efficient.

And we know that you care about performance too, which is why we're going to share performance benchmarks.

## How we benchmark performance

It's important to have reliable tests that we can use to assess performance changes over time. 
That's why we'll be running tests on an isolated EC2 instance, to ensure that results are not affected by any other processes. 
Each batch of tests will be run on a newly deployed EC2 instance.

We use the [Java Microbenchmark Harness](https://github.com/openjdk/jmh) (JMH) to run the benchmark tests. 
You can see the contents of the test files in the [graphql-java repository](https://github.com/graphql-java/graphql-java).

With every batch of test results, we will also publish important parameters such as the EC2 instance type and JDK version used.

## Sharing performance benchmarks

We aim to publish performance benchmarks for every major version release of GraphQL Java. We may publish more frequently in the future.

We'll also publish performance benchmarks for any pull requests targeting performance, to help assess the impact of the pull request.

As you probably already know, performance benchmarks are both art and science. This is a new initiative, so you may see adjustments in the testing methodology while we settle on the best way forward. If you have feedback, please let us know on [GitHub Discussions](https://github.com/graphql-java/graphql-java/discussions).
