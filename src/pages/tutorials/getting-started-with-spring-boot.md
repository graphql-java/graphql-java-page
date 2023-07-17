---
title: Tutorial with Spring for GraphQl
sidebar_position: 1
id: tutorial-getting-started
---
# Getting started with Spring for GraphQL

In this tutorial, you will create a GraphQL server in Java using [Spring for GraphQL](https://docs.spring.io/spring-graphql/docs/current/reference/html/). It requires a little Spring and Java knowledge. While we give a brief introduction to GraphQL, the focus of this tutorial is developing a GraphQL server in Java.

If you're looking to learn more after this tutorial, we (the maintainers) have written a book! [**GraphQL with Java and Spring**](https://leanpub.com/graphql-java) includes everything you need to know to build a production ready GraphQL service with Spring for GraphQL. It's available on [Leanpub](https://leanpub.com/graphql-java) and [Amazon](https://www.amazon.com/GraphQL-Java-Spring-Andreas-Marek-ebook/dp/B0C96ZYWPF/).

## A very short introduction to GraphQL

GraphQL is a query language to retrieve data from a server. It is an alternative to REST, SOAP or gRPC.

Let's suppose we want to query the details for a specific book from an online store backend.

With GraphQL you send the following query to the server to get the details for the book with the id "book-1":

```graphql
query bookDetails {
  bookById(id: "book-1"){
    id
    name
    pageCount
    author {
      firstName
      lastName
    }
  }
}
```

This is not JSON (even though it looks deliberately similar), it is a GraphQL query.
It basically says:

- query a book with a specific id
- get me the id, name, pageCount and author from that book
- for the author, I want to know the firstName and lastName

The response is normal JSON:
```json
{
  "bookById": {
    "id":"book-1",
    "name":"Harry Potter and the Philosopher's Stone",
    "pageCount":223,
    "author": {
      "firstName":"Joanne",
      "lastName":"Rowling"
    }
  }
}
```

One very important property of GraphQL is that it is statically typed: the server knows exactly the shape of every object you can query and any client can actually "introspect" the server and ask for the "schema". The schema describes what queries are possible and what fields you can get back. (Note: when we refer to schema here, we always refer to a "GraphQL Schema", which is not related to other schemas like "JSON Schema" or "Database Schema")

The schema for the above query looks like this:

```graphql
type Query {
  bookById(id: ID): Book
}

type Book {
  id: ID
  name: String
  pageCount: Int
  author: Author
}

type Author {
  id: ID
  firstName: String
  lastName: String
}
```

This tutorial will focus on how to implement a GraphQL server with this schema in Java.

We've barely scratched the surface of what's possible with GraphQL. Further information can be found on the [official GraphQL page](https://graphql.org/learn/).

## GraphQL Java Overview

[GraphQL Java](https://www.graphql-java.com) is the Java (server) implementation for GraphQL.
There are several repositories in the GraphQL Java Github org. The most important one is the [GraphQL Java Engine](https://github.com/graphql-java/graphql-java) which is the basis for everything else.

The GraphQL Java Engine is only concerned with executing queries. It doesn't deal with any HTTP or JSON related topics. For these aspects, we will use [Spring for GraphQL](https://docs.spring.io/spring-graphql/docs/current/reference/html/) which takes care of exposing our API via Spring Boot over HTTP.

The main steps of creating a GraphQL Java server are:

1. Defining a GraphQL Schema.
2. Deciding on how the actual data for a query is fetched.

## Our example API: getting book details

Our example app will be a simple API to get details for a specific book.
This is in no way a comprehensive API, but it is enough for this tutorial.

## Create a Spring Boot app

The easiest way to create a Spring Boot app is to use the [Spring Initializr](https://start.spring.io/).

Select:

- Gradle Project
- Java
- Spring Boot 2.7.x

For the project metadata, use:

- Group: `com.graphql-java.tutorial`
- Artifact: `bookDetails`

For dependencies, use:

- Spring Web
- Spring for GraphQL

Then click on `Generate` for a ready to use Spring Boot app.
All subsequently mentioned files and paths will be relative to this generated project.

Spring for GraphQL adds many useful features including loading schema files, initializing GraphQL Java, and simplifying data fetching with controller annotations.

## Schema

Create a directory `src/main/resources/graphql`. 

Add a new file `schema.graphqls` to `src/main/resources/graphql` with the following content:

```graphql
type Query {
  bookById(id: ID): Book
}

type Book {
  id: ID
  name: String
  pageCount: Int
  author: Author
}

type Author {
  id: ID
  firstName: String
  lastName: String
}
```

This schema defines one top level field (in the type `Query`): `bookById` which returns the details of a specific book.

It also defines the type `Book` which has the fields: `id`, `name`, `pageCount` and `author`.
`author` is of type `Author`, which is defined after `Book`.

> The Domain Specific Language (shown above) used to describe a schema is called the Schema Definition Language or SDL. More details about it can be found [here](https://graphql.org/learn/schema/).

## Source of the data
To simplify the tutorial, book and author data will come from static lists inside their respective classes.
It is very important to understand that GraphQL doesn't dictate in any way where the data comes from. 
This is the power of GraphQL: it can come from a static in-memory list, from a database or an external service.

### Create the Book class
Add the following to `bookDetails/Book.java`
```java
public class Book {

    private String id;
    private String name;
    private int pageCount;
    private String authorId;

    public Book(String id, String name, int pageCount, String authorId) {
        this.id = id;
        this.name = name;
        this.pageCount = pageCount;
        this.authorId = authorId;
    }
    
    private static List<Book> books = Arrays.asList(
            new Book("book-1", "Harry Potter and the Philosopher's Stone", 223, "author-1"),
            new Book("book-2", "Moby Dick", 635, "author-2"),
            new Book("book-3", "Interview with the vampire", 371, "author-3")
    );

    public static Book getById(String id) {
        return books.stream().filter(book -> book.getId().equals(id)).findFirst().orElse(null);
    }

    public String getId() {
        return id;
    }

    public String getAuthorId() {
        return authorId;
    }
}
```

### Create the Author class
Add the following to `bookDetails/Author.java`
```java
public class Author {

    private String id;
    private String firstName;
    private String lastName;

    public Author(String id, String firstName, String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    private static List<Author> authors = Arrays.asList(
            new Author("author-1", "Joanne", "Rowling"),
            new Author("author-2", "Herman", "Melville"),
            new Author("author-3", "Anne", "Rice")
    );

    public static Author getById(String id) {
        return authors.stream().filter(author -> author.getId().equals(id)).findFirst().orElse(null);
    }

    public String getId() {
        return id;
    }
}
```

## Adding code to fetch data
Spring for GraphQL provides an [annotation-based programming model](https://docs.spring.io/spring-graphql/docs/current/reference/html/#controllers) to declare handler methods to fetch the data for specific GraphQL fields.

Add the following to `bookDetails/BookController.java`

```java
@Controller
public class BookController {
    @QueryMapping
    public Book bookById(@Argument String id) {
        return Book.getById(id);
    }

    @SchemaMapping
    public Author author(Book book) {
        return Author.getById(book.getAuthorId());
    }
}
```
The `@QueryMapping` annotation binds this method to a query, a field under the Query type.
The query field is then determined from the method name, `bookById`. It could also be declared on the annotation. 
Spring for GraphQL uses `RuntimeWiring.Builder` to register the handler method as a `graphql.schema.DataFetcher` for the query field `bookById`.

In GraphQL Java, `DataFetchingEnvironment` provides access to a map of field-specific argument values.
Use the `@Argument` annotation to have an argument bound to a target object and injected into the handler method.
By default, the method parameter name is used to look up the argument.
The argument name can be specified in the annotation.

The `@SchemaMapping` annotation maps a handler method to a field in the GraphQL schema and declares it to be the `DataFetcher` for that field.
The field name defaults to the method name, and the type name defaults to the simple class name of the source/parent object injected into the method. In this example, the field defaults to `author` and the type defaults to `Book`.
The type and field can be specified in the annotation.

For more, see the [documentation for the Spring for GraphQL annotated controller feature](https://docs.spring.io/spring-graphql/docs/current/reference/html/#controllers).

That's all the code we need! Let's run our first query.

## Running our first query

### Enable the GraphiQL Playground
GraphiQL is a useful visual interface for writing and executing queries, and much more. Enable GraphiQL by adding this config to the `application.properties` file.

```
spring.graphql.graphiql.enabled=true
spring.graphql.graphiql.path=/graphiql
```

### Boot the application
Start your Spring application. 

Navigate to [http://localhost:8080/graphiql](http://localhost:8080/graphiql) or your custom URL.

### Run the query
Type in the query and hit the play button at the top of the window.

```graphql
query bookDetails {
  bookById(id: "book-1") {
    id
    name
    pageCount
    author {
      id
      firstName
      lastName
    }
  }
}
```

You should see a response like this.
![GraphQL response](/img/graphiQL.png)

We have built a GraphQL server and run our first query! 
With the help of Spring for GraphQL features, we were able to achieve this with only a few lines of code.

## Further reading
### Book
If you want to learn more, we have written a book! [**GraphQL with Java and Spring**](https://leanpub.com/graphql-java) includes everything you need to know to build a production ready GraphQL service with Spring for GraphQL. 

Learn first-hand from the founder of GraphQL Java and co-author of Spring for GraphQL. The book is suitable for beginners and also includes advanced topics for intermediate readers. The book is available on [Leanpub](https://leanpub.com/graphql-java) and [Amazon](https://www.amazon.com/GraphQL-Java-Spring-Andreas-Marek-ebook/dp/B0C96ZYWPF/).

### Sample source code
The source code for this tutorial can be found on [GitHub](https://github.com/graphql-java/tutorials).

### Documentation
Read the GraphQL Java [documentation](https://www.graphql-java.com/documentation/getting-started).

### More Spring for GraphQL examples
See samples in the [1.0.x branch](https://github.com/spring-projects/spring-graphql/tree/1.0.x/samples), which will soon be [moved into](https://github.com/spring-projects/spring-graphql/issues/208) a separate repository.

### GitHub Discussions
We also use [GitHub Discussions](https://github.com/graphql-java/graphql-java/discussions) for any questions or problems.