---
title: "Moving projects out of the GraphQL Java org"
authors: andi
slug: moving-projects
---

Soon after I started started GraphQL Java (almost 3 1/2 years ago) other people started building libraries on top of it. I was happy to welcome them into the [GraphQL Java Github organization](https://github.com/graphql-java/), because it was great to see the GraphQL Java ecosystem grew and centralizing these projects into one org made sense.

Fast forward to today: the core library [graphql-java](https://github.com/graphql-java/graphql-java) is maintained by myself and my co-maintainer Brad, but we are not involved in `graphql-spring-boot` and other projects. They are independently released and organized without any involvement from us. This leads to confusion from our users and makes it hard to recognize what actually the Graphql Java project is and what are libraries build on top without any involvement from Graphql Java.

In order to clear up this confusion we have decided to move these projects or to archive them:

- `graphql-spring-boot` is moved to https://github.com/graphql-java-kickstart/graphql-spring-boot
- `graphql-java-tools` is moved to https://github.com/graphql-java-kickstart/graphql-java-tools
- `graphql-java-servlet` is moved to https://github.com/graphql-java-kickstart/graphql-java-servlet
- `graphql-java-annotations` is moved to https://github.com/Enigmatis/graphql-java-annotations
- `graphql-java-type-generator` is archived and  in read only mode: https://github.com/graphql-java/graphql-java-type-generator/

I wanna make clear that these projects are valuable and successful projects and moving them out of the GraphQL Java Github organization is done to reduce confusion as described above.

Cheers,

Andi
