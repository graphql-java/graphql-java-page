---
title: "Creating a schema"
date: 2018-09-09T12:52:46+10:00
draft: false
tags: [introduction]
---
# Creating a schema

A schema defines your GraphQL API by defining each field that can be queried or mutated.

`graphql-java` offers two different ways of defining the schema: Programmatically as Java code or via a special graphql dsl (called SDL).

If you are unsure which option to use we recommend the SDL.

SDL example:

{{< highlight graphql "linenos=table" >}}
type Foo {
    bar: String
}
{{< / highlight >}}
<br/>
<br/>
Java code example:

{{< highlight java "linenos=table" >}}
GraphQLObjectType fooType = newObject()
    .name("Foo")
    .field(newFieldDefinition()
            .name("bar")
            .type(GraphQLString))
    .build();
{{< / highlight >}}
