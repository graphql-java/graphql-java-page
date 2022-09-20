---
title: "Spring for GraphQL is the recommended Spring integration"
authors: andi
slug: spring-for-graphql
---

If you are building a GraphQL application with Spring, we recommend using the official [Spring for GraphQL](https://spring.io/projects/spring-graphql) integration. This integration is a collaboration between the Spring and GraphQL Java teams, and is maintained by the Spring team. In May 2022, Spring for GraphQL 1.0 GA was [released](https://spring.io/blog/2022/05/19/spring-for-graphql-1-0-release).

Use [Spring Initializr](https://start.spring.io/) to create a GraphQL application. For a quick tutorial, please see our [Spring for GraphQL tutorial](https://www.graphql-java.com/tutorials/getting-started-with-spring-boot).

See also the Spring for GraphQL [documentation](https://docs.spring.io/spring-graphql/docs/current/reference/html/) and the repo on [GitHub](https://github.com/spring-projects/spring-graphql).

Before the official Spring for GraphQL integration was released, there were many other GraphQL integrations for Spring, including the similarly and confusingly named [GraphQL Java Spring](https://github.com/graphql-java/graphql-java-spring) project from the GraphQL Java team, published under the `com.graphql-java` group ID. Many tutorials are still referring to this archived and unrelated project.

To avoid confusion, please use the official integration named **"Spring for GraphQL"**, published under `org.springframework` and related group IDs.
