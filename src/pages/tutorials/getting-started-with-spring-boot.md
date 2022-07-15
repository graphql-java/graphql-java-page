---
title: Tutorial with Spring for GraphQl
sidebar_position: 1
id: tutorial-getting-started
---
# Getting started with Spring for GraphQL

In this tutorial, you will create a GraphQL server in Java using [Spring for GraphQL](https://docs.spring.io/spring-graphql/docs/current/reference/html/). It requires a little Spring and Java knowledge. While we give a brief introduction to GraphQL, the focus of this tutorial is developing a GraphQL server in Java.

## A very short introduction to GraphQL

GraphQL is a query language to retrieve data from a server. It is an alternative to REST, SOAP or gRPC.

Let's suppose we want to query the details for a specific book from an online store backend.

With GraphQL you send the following query to the server to get the details for the book with the id "book-1":

```graphql
{
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
- Artifact: `book-details`

For dependencies, use:

- Spring Web
- Spring for GraphQL

Then click on `Generate` for a ready to use Spring Boot app.
All subsequently mentioned files and paths will be relative to this generated project.

Spring for GraphQL adds many useful features including loading schema files, initializing GraphQL Java, and simplifying data fetching with controller annotations.

Let's first use the Spring for GraphQL features to quickly build a working app. Later in this tutorial, we'll discuss how to replicate the Spring for GraphQL magic manually. 

## Schema

Create a directory `src/main/resources/graphql`. 

Add a new file `schema.graphqls` to `src/main/resource/graphql` with the following content:

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

This schema defines one top level field (in the type `Query`):  `bookById` which returns the details of a specific book.

It also defines the type `Book` which has the fields: `id`, `name`, `pageCount` and `author`.
`author` is of type `Author`, which is defined after `Book`.

> The Domain Specific Language (shown above) used to describe a schema is called the Schema Definition Language or SDL. More details about it can be found [here](https://graphql.org/learn/schema/).

## Source of the data
To simplify the tutorial, book and author data will come from static lists inside their respective classes.
It is very important to understand that GraphQL doesn't dictate in any way where the data comes from. 
This is the power of GraphQL: it can come from a static in memory list, from a database or an external service.

### Create the Book class
Add the following to `book-details/Book.java`
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
Add the following to `book-details/Author.java`
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

Later in this tutorial we'll discuss how to manually create and register DataFetchers, without using this annotation feature.

Add the following to `book-details/BookController.java`

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

Navigate to http://localhost:8080/graphiql or your custom URL.

### Run the query
Type in the query and hit the play button at the top of the window.

```graphql
query {
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

We have built a GraphQL server and run our first query. 
With the help of Spring for GraphQL features, we were able to achieve this with only a few lines of code.

## Initializing GraphQL Java
Let's dive into further detail into initializing GraphQL Java.

`GraphQlSource` is the core Spring abstraction for access to the `graphql.GraphQL` instance to use for request execution.
It provides a builder API to initialize GraphQL Java and build a `GraphQlSource`.
See the [Spring for GraphQL documentation](https://docs.spring.io/spring-graphql/docs/current/reference/html/#execution-graphqlsource) for more detail on how to use the API to initialize GraphQL Java objects.

To help explain the key concepts, the following examples illustrate how to initialize GraphQL Java *without* Spring for GraphQL features.

To make life a little easier, add [Google Guava](https://github.com/google/guava) to dependencies in `build.gradle`.
```groovy
dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-graphql'
	implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.google.guava:guava:26.0-jre' // NEW
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
	testImplementation 'org.springframework:spring-webflux'
	testImplementation 'org.springframework.graphql:spring-graphql-test'
}
```

Create a new `GraphQLProvider` class with an `init` method which will create a `GraphQL` instance:

```java
@Component
public class GraphQLProvider {

    private GraphQL graphQL;

    @Bean
    public GraphQL graphQL() {
        return graphQL;
    }

    @PostConstruct
    public void init() throws IOException {
        URL url = Resources.getResource("schema.graphqls");
        String sdl = Resources.toString(url, Charsets.UTF_8);
        GraphQLSchema graphQLSchema = buildSchema(sdl);
        this.graphQL = GraphQL.newGraphQL(graphQLSchema).build();
    }

    private GraphQLSchema buildSchema(String sdl) {
      // TODO: we will create the schema here later
    }
}
```

We use Guava `Resources` to read the file from our classpath, then create a `GraphQLSchema` and `GraphQL` instance. 
This `GraphQL` instance is exposed as a Spring Bean via the `graphQL()` method annotated with `@Bean`. 
Spring for GraphQL uses a `GraphQL` instance to make our schema available via HTTP.

What we still need to do is to implement the `buildSchema` method which creates the `GraphQLSchema` instance and wires in code to fetch data:

```java
@Autowired
GraphQLDataFetchers graphQLDataFetchers;

private GraphQLSchema buildSchema(String sdl) {
    TypeDefinitionRegistry typeRegistry = new SchemaParser().parse(sdl);
    RuntimeWiring runtimeWiring = buildWiring();
    SchemaGenerator schemaGenerator = new SchemaGenerator();
    return schemaGenerator.makeExecutableSchema(typeRegistry, runtimeWiring);
}

private RuntimeWiring buildWiring() {
    return RuntimeWiring.newRuntimeWiring()
            .type(newTypeWiring("Query")
                    .dataFetcher("bookById", graphQLDataFetchers.getBookByIdDataFetcher()))
            .type(newTypeWiring("Book")
                    .dataFetcher("author", graphQLDataFetchers.getAuthorDataFetcher()))
            .build();
}
```

`TypeDefinitionRegistry` is the parsed version of our schema file. `SchemaGenerator` combines the `TypeDefinitionRegistry` with `RuntimeWiring` to actually make the `GraphQLSchema`.

`buildWiring` uses the `graphQLDataFetchers` bean to actually register two `DataFetcher`s:

- One to retrieve a book with a specific ID
- One to get the author for a specific book.

`DataFetcher` and how to implement the `GraphQLDataFetchers` bean is explained in the next section.

Overall the process of creating a `GraphQL` and `GraphQLSchema` instance looks like this:

![Creating GraphQL](/img/graphql_creation.png)

### Book DataFetcher
```java
public DataFetcher getBookByIdDataFetcher() {
    return dataFetchingEnvironment -> {
        String bookId = dataFetchingEnvironment.getArgument("id");
        return Book.getById(bookId);
    };
}
```
Our first method `getBookByIdDataFetcher` returns a `DataFetcher` implementation which takes a `DataFetcherEnvironment` and returns a book.
In our case this means we need to get the `id` argument from the `bookById` field and find the book with this specific id. If we can't find it, we just return null.

The "id" in `String bookId = dataFetchingEnvironment.getArgument("id");` is the "id" from the `bookById` query field in the schema:

```graphql
type Query {
  bookById(id: ID): Book
}
...
```

### Author DataFetcher
```java
public DataFetcher getAuthorDataFetcher() {
    return dataFetchingEnvironment -> {
        Book book = dataFetchingEnvironment.getSource();
        String authorId = book.getAuthorId();
        return Author.getById(authorId);
    };
}
```
Our second method `getAuthorDataFetcher`, returns a `DataFetcher` for getting the author for a specific book.
Compared to the previously described book `DataFetcher`, we don't have an argument, but we have a book instance.
The result of the `DataFetcher` from the parent field is made available via `getSource`.
This is an important concept to understand: the `DataFetcher` for each field in GraphQL are called in a top-down fashion and the parent's result is the `source` property of the child `DataFetcherEnvironment`.

We then use the previously fetched book to get the `authorId` and look for that specific author in the same way we look for a specific book.

### Default DataFetchers
We only implement two `DataFetchers`. As mentioned above, if you don't specify one, the default `PropertyDataFetcher` is used. In our case it means `Book.id`, `Book.name`, `Book.pageCount`, `Author.id`, `Author.firstName` and `Author.lastName` all have a default `PropertyDataFetcher` associated with it.

A `PropertyDataFetcher` tries to lookup a property on a Java object in multiple ways. 
In case of a `POJO` it assumes that for a GraphQL field `fieldX` it can find a POJO property called `fieldX`.

## Further reading
### Sample source code
TODO upload this tutorial's sample code to the GraphQL Java org

The source code for this tutorial can be found on GitHub.

### Documentation
Read the GraphQL Java [documentation](https://www.graphql-java.com/documentation/).

### More Spring for GraphQL examples
See more examples in the [Spring for GraphQL GitHub repo](https://github.com/spring-projects/spring-graphql/tree/main/samples).

### GitHub Discussions
We also use [GitHub Discussions](https://github.com/graphql-java/graphql-java/discussions) for any questions or problems.