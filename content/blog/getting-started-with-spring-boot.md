+++
title = "Getting started with GraphQL Java and Spring Boot"
author = "Andreas Marek"
tags = []
categories = []
date = 2018-10-22T01:00:00+10:00
+++

This is a tutorial for people who never development a GraphQL server with Java. Some Spring Boot and Java knowledge is required. While we give a brief introduction into GraphQL the focus of this tutorial is on developing a GraphQL server in Java.


# GraphQL in 3 minutes

GraphQL is a query language to retrieve data from a server. It is an alternative to REST, SOAP or gRPC in some way. 

For example we wanna query the details for specific book from a online store backend.

With GraphQL you send the following query to server to get the details for the book with the id "123":

{{< highlight graphql "linenos=table" >}}
{
  book(id: "123"){
    id
    name
    pageCount
    author {
      firstName
      lastName
    }
  }
}
{{< / highlight >}}

This is not JSON (even if it looks remotely similar), but it is a GraphQL query.

But the response is normal JSON:
{{< highlight json "linenos=table" >}}
{
  "id":"123",
  "name":"Harry Potter and the Philosopher's Stone",
  "pageCount":223,
  "author": {
    "firstName":"J. K.",
    "lastName":"Rowling"
  }
}
{{< / highlight >}}

One very important property of GraphQL is that it is statically typed: the server knows exactly of the shape of every object you can query and any client can actually "inspect" the server and ask for the so called "schema". The schema describes what queries are possible and what fields you can get back. 

The schema for the above query looks like this:

{{< highlight graphql "linenos=table" >}}
type Query {
  book(id: ID): Book 
}

type Book {
  id: ID
  name: String
  pageCount: Int
  author: Person
}

type Person {
  firstName: String
  lastName: String
}
{{< / highlight >}}

This tutorial will focus on how to implement a GraphQL server in Java.

We barely touched GraphQL. Further information can be found on the official page: https://graphql.github.io/learn/


# GraphQL Java Overview

[GraphQL Java](https://www.graphql-java.com) is the Java (server) implementation for GraphQL. The [GraphQL Java Github Repo](https://github.com/graphql-java/graphql-java) contains the actual source code. 

GraphQL Java itself is only concerned with executing queries. It doesn't deal with any HTTP or JSON related topics. For these aspects we will use [Spring Boot](https://spring.io/projects/spring-boot).
 
The main steps of creating a GraphQL Java server are:

- Defining a GraphQL Schema.
- Defining on how the actual data for a query is fetched. 
- Exposing the server via HTTP (via Spring Boot). 


# Our example app: an online store for books

Our example app we will build is a simple online store for books.
We assume the very simple user flow: 

the user comes to our page and sees all available books for order.
They can select a specific book and look up the details. If they like it they can order it.

We will build a GraphQL server which will cover the following use cases:

1. get a list of available books
1. get specific book details
1. order a book

We will incrementally build our app. 

> **What about the schema/API design?**<br/>
Schema and API design itself is interesting and challenging but we will focus on implementing the server and not discuss the actual schema design choices.


# Step 1: Create a Spring Boot app

The easiest way to create a Spring Boot app is to use the initializr at https://start.spring.io/.

Select: 

- Gradle Project
- Java 
- Spring Boot 2.x 

For the project metadata we use:

- Group: `com.graphql-java.tutorial`
- Artifact: `online-store`

As dependency we just select `Web`.

A click on `Generate Project` will give you a ready to use Spring Boot app.
All subsequently mentioned files and paths will be relative to this generated project.

We are adding two dependency to our project inside the `dependencies` section of `build.gradle`:

the first one is GraphQL Java itself and the second one is [Google Guava](https://github.com/google/guava). Guava is not strictly needed but it will make our life easier.

{{< highlight groovy "linenos=table" >}}
dependencies {
  ...
  implementation('com.graphql-java:graphql-java:11.0')
  implementation('com.google.guava:guava:26.0-jre')
}
{{< / highlight >}}

## Defining our first schema

We are creating a new file `schema.graphqls` in `src/main/resources` with the following content:

{{< highlight graphql "linenos=table" >}}
type Query {
  books: [Books]
}

type Book {
  id: ID
  name: String
}

{{< / highlight >}}

This schema defines one query: `books` which results a list of `Book`s. It also defines the type `Book` which has two fields: `id` and `name`. 

> The Domain Specific Language shown above which is used to describe a schema is called Schema Definition Language or SDL.

But so far it is just a normal text. We need to "bring it to live" by reading the file and parsing it.
We are using Guava to read the file at runtime from our classpath:

{{< highlight java "linenos=table" >}}
URL url = Resources.getResource("schema.graphql");
String sdl = Resources.toString(url, Charsets.UTF_8);
{{< / highlight >}}

We now using GraphQL Java for the first time: We are transforming the `sdl` into a `TypeDefinitionRegistry`:


{{< highlight java "linenos=table" >}}
  TypeDefinitionRegistry typeRegistry = new SchemaParser().parse(sdl);
{{< / highlight >}}

This `TypeDefinitionRegistry` is just a parsed version of the schema definition file.

## Creating a GraphQLSchema

The `typeRegistry` defined above is just types: it describes how the schema looks like, but not how it actually works when a query is executed.  


### DataFetcher

Probably the most important concept of a GraphQL Java server is a `DataFetcher`:
A `DataFetcher` fetches the Data for one field while the query is executed. 

While GraphQL Java is executing a query it calls the appropriate `DataFetcher` for each field it encounters in query.




