---
title: "Automated performance testing for GraphQL Java"
authors: andi   
slug: performance
---

GraphQL Java has become a mature and widely adopted library over the past 9.5 years.
And while we continue to maintain, improve and add features, we don't expect revolutionary changes to the core of the library.

As side effect of this maturity it became clear over the least years, that performance is a key aspect that users are interested in.
Especially in larger scale applications performance can have a huge impact on operational costs and user experience.

In GraphQL Java we leverage [JMH aka Java Microbenchmark Harness](https://github.com/openjdk/jmh) to  measure and compare different performance aspects.

Historically, performance testing was done manually by running JMH benchmarks on a local machine.

This comes with the obvious flaw that it's not reproducible over time and across different machines. A benchmark run on one developer's machine is not
comparable to a run on another developer's machine (or often even the same machine months later).

We are very happy to share that we have now an automated performance testing setup in place to overcome these limitations by running
the benchmarks in an isolated cloud environment.

Currently, it runs on every commit to the `master` branch and the results are stored in the  
[performance results folder](https://github.com/graphql-java/graphql-java/tree/master/performance-results).

Our goal is to provide clear and reproducible performance improvements over time while preventing any regressions.

This work is sponsored and made possible by [Atlassian](https://www.atlassian.com/) and we are very grateful for their support.






