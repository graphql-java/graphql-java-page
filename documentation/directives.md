---
title: "SDL directives"
date: 2018-09-09T12:52:46+10:00
description: How SDL Directives can be used to adjust the behavior of your graphql API
---
# Directives

[Directives](https://spec.graphql.org/draft/#sec-Language.Directives) are a powerful feature of GraphQL, allowing you to declare additional data to a schema or document. This data can then be used to change runtime execution or type validation behavior.

There are two broad categories of directives, schema and operation directives. Schema directives are used on schema elements, and operation directives are used in operations within a GraphQL document.

Often, operation directives are also called "query directives", although they can be used in any GraphQL operation. Whilst both names can be used interchangeably, note that GraphQL Java class names use "query directives". 

Note for those who love the details: the terminology of directives is a bit confusing. It is technically possible to define a directive that is both a schema and operation directive, in other words, defined for both schema and operation locations. However in practice, this is not common.

# Schema Directives

## Adding Behaviour

Schema Definition Language (SDL) allows you to define your graphql types in a declarative manner without using code.  However you still need to wire in all the
logic that backs those types and their fields.

Schema directives allow you to do this.  You can place directives on SDL elements and then write the backing logic
once and have it apply in many places.

This idea of "writing it once" is the key concept here.  There is only code place where
logic needs to be written and it is then applied to all the places in the SDL that have a named directive.

This is a more powerful model than wiring in 10-100s of data fetchers like you might
with the conventional runtime wiring.

For example imagine you have a type like the following

```graphql
type Employee
  id : ID
  name : String!
  startDate : String!
  salary : Float
}
```

Publishing ``salary`` information to every one who can see this employee's ``name`` might not be what you want.  Rather you want some sort of access control
to be in place such that if your role is that of a manager, you can see salaries, otherwise you get no data back.

Directives can help you declare this more easily.  Our declaration above would become something like the following:

```graphql
directive @auth(role : String!) on FIELD_DEFINITION

type Employee
  id : ID
  name : String!
  startDate : String!
  salary : Float @auth(role : "manager")
}
```

So we have said that only people who have the role ``manager`` are authorised to see this field.  We can now use this directive on ANY field
that needs manager role authorisation.


```graphql
directive @auth(role : String!) on FIELD_DEFINITION

type Employee
  id : ID
  name : String!
  startDate : String!
  salary : Float @auth(role : "manager")
}

type Department {
  id : ID
  name : String
  yearlyOperatingBudget : Float @auth(role : "manager")
  monthlyMarketingBudget : Float @auth(role : "manager")
}
```

We now need to wire in the code that can handle any field with this ``@auth`` directive.  We use ``graphql.schema.idl.SchemaDirectiveWiring`` to do this.

```java
class AuthorisationDirective implements SchemaDirectiveWiring {

    @Override
    public GraphQLFieldDefinition onField(SchemaDirectiveWiringEnvironment<GraphQLFieldDefinition> environment) {
        String targetAuthRole = (String) environment.getAppliedDirective().getArgument("role").getArgumentValue().getValue();

        //
        // build a data fetcher that first checks authorisation roles before then calling the original data fetcher
        //
        DataFetcher originalDataFetcher = environment.getFieldDataFetcher();
        DataFetcher authDataFetcher = new DataFetcher() {
            @Override
            public Object get(DataFetchingEnvironment dataFetchingEnvironment) throws Exception {
                AuthorisationCtx authContext = dataFetchingEnvironment.getGraphQlContext().get("authContext");

                if (authContext.hasRole(targetAuthRole)) {
                    return originalDataFetcher.get(dataFetchingEnvironment);
                } else {
                    return null;
                }
            }
        };
        //
        // now change the field definition to have the new authorising data fetcher
        return environment.setFieldDataFetcher(authDataFetcher);
    }
}

//
// we wire this into the runtime by directive name
//
RuntimeWiring.newRuntimeWiring()
        .directive("auth", new AuthorisationDirective())
        .build();
```

This has modified the ``GraphQLFieldDefinition`` so that its original data fetcher will ONLY be called if the current authorisation context
has the ``manager`` role. You can use any mechanism for authorisation, for example Spring Security or anything else.

You would provide this authorisation checker into the execution "context" object of the graphql input, so it can then be accessed later in the
``DataFetchingEnvironment``.

```java
AuthorisationCtx authCtx = AuthorisationCtx.obtain();

ExecutionInput executionInput = ExecutionInput.newExecutionInput()
        .query(query)
        .graphQLContext(builder -> builder.put("authContext", authCtx))
        .build();
```

## Declaring Directives

In order to use a directive in SDL, the graphql specification requires that you MUST declare its shape before using it. Our ``@auth`` directive example above needs to be
declared like so before use.

```graphql
# This is a directive declaration
directive @auth(role : String!) on FIELD_DEFINITION

type Employee
  id : ID

  # and this is a usage of that declared directive
  salary : Float @auth(role : "manager")
}
```

The one exception to this is the ``@deprecated`` directive which is implicitly declared for you as follows:

```graphql
directive @deprecated(reason: String = "No longer supported") on FIELD_DEFINITION | ENUM_VALUE
```

The valid SDL directive locations are as follows:

```graphql
SCHEMA,
SCALAR,
OBJECT,
FIELD_DEFINITION,
ARGUMENT_DEFINITION,
INTERFACE,
UNION,
ENUM,
ENUM_VALUE,
INPUT_OBJECT,
INPUT_FIELD_DEFINITION
```

Directives are commonly applied to fields definitions but as you can see there are a number of places they can be applied.

## Another Example - Date Formatting

Date formatting is a cross-cutting concern that we should only have to write once and apply it in many areas.

The following demonstrates an example schema directive that can apply date formatting to fields that are ``LocaleDate`` objects.

What's great in this example is that it adds an extra ``format`` argument to each field that it is applied to. So the clients can
opt into what ever date formatting you provide per request.

```graphql
directive @dateFormat on FIELD_DEFINITION

type Query {
  dateField : String @dateFormat
}
```

Then our runtime code could be :

```java
public static class DateFormatting implements SchemaDirectiveWiring {
    @Override
    public GraphQLFieldDefinition onField(SchemaDirectiveWiringEnvironment<GraphQLFieldDefinition> environment) {
        GraphQLFieldDefinition field = environment.getElement();
        GraphQLFieldsContainer parentType = environment.getFieldsContainer();
        //
        // DataFetcherFactories.wrapDataFetcher is a helper to wrap data fetchers so that CompletionStage is handled correctly
        // along with POJOs
        //
        DataFetcher originalFetcher = environment.getCodeRegistry().getDataFetcher(parentType, field);
        DataFetcher dataFetcher = DataFetcherFactories.wrapDataFetcher(originalFetcher, ((dataFetchingEnvironment, value) -> {
            DateTimeFormatter dateTimeFormatter = buildFormatter(dataFetchingEnvironment.getArgument("format"));
            if (value instanceof LocalDateTime) {
                return dateTimeFormatter.format((LocalDateTime) value);
            }
            return value;
        }));

        //
        // This will extend the field by adding a new "format" argument to it for the date formatting
        // which allows clients to opt into that as well as wrapping the base data fetcher so it
        // performs the formatting over top of the base values.
        //
        FieldCoordinates coordinates = FieldCoordinates.coordinates(parentType, field);
        environment.getCodeRegistry().dataFetcher(coordinates, dataFetcher);

        return field.transform(builder -> builder
                .argument(GraphQLArgument
                        .newArgument()
                        .name("format")
                        .type(Scalars.GraphQLString)
                        .defaultValueProgrammatic("dd-MM-YYYY")
                )
        );
    }

    private DateTimeFormatter buildFormatter(String format) {
        String dtFormat = format != null ? format : "dd-MM-YYYY";
        return DateTimeFormatter.ofPattern(dtFormat);
    }
}

static GraphQLSchema buildSchema() {

    String sdlSpec = "directive @dateFormat on FIELD_DEFINITION\n" +
                  "type Query {\n" +
                  "    dateField : String @dateFormat \n" +
                  "}";

    TypeDefinitionRegistry registry = new SchemaParser().parse(sdlSpec);

    RuntimeWiring runtimeWiring = RuntimeWiring.newRuntimeWiring()
            .directive("dateFormat", new DateFormatting())
            .build();

    return new SchemaGenerator().makeExecutableSchema(registry, runtimeWiring);
}

public static void main(String[] args) {
    GraphQLSchema schema = buildSchema();
    GraphQL graphql = GraphQL.newGraphQL(schema).build();

    Map<String, Object> root = new HashMap<>();
    root.put("dateField", LocalDateTime.of(1969, 10, 8, 0, 0));

    String query = "" +
            "query {\n" +
            "    default : dateField \n" +
            "    usa : dateField(format : \"MM-dd-YYYY\") \n" +
            "}";

    ExecutionInput executionInput = ExecutionInput.newExecutionInput()
            .root(root)
            .query(query)
            .build();

    ExecutionResult executionResult = graphql.execute(executionInput);
    Map<String, Object> data = executionResult.getData();

    // data['default'] == '08-10-1969'
    // data['usa'] == '10-08-1969'
}
```

Notice the SDL definition did not have a ``format`` argument yet once the directive wiring is applied, it is added
to the field definition and hence clients can begin to use it.

Please note that graphql-java does not ship with this implementation. It is merely provided here as
an example of what you could add yourself.


## Chaining Behaviour

The directives are applied in the order they are encountered. For example imagine directives that changed the case of a field value.

```graphql
directive @uppercase on FIELD_DEFINITION
directive @lowercase on FIELD_DEFINITION
directive @mixedcase on FIELD_DEFINITION
directive @reversed on FIELD_DEFINITION

type Query {
  lowerCaseValue : String @uppercase
  upperCaseValue : String @lowercase
  mixedCaseValue : String @mixedcase

  #
  # directives are applied in order hence this will be lower, then upper, then mixed then reversed
  #
  allTogetherNow : String @lowercase @uppercase @mixedcase @reversed
}
```

When the above was executed each directive would be applied one on top of the other. Each directive implementation should be careful
to preserve the previous data fetcher to retain behaviour (unless of course you mean to throw it away)

# Operation Directives (also known as Query Directives)
Let's define an operation directive `@cache`, which can be used on operation fields. 

```graphql
# Can only be used on a field in a GraphQL document
directive @cache on FIELD

type Query {
    pet: Pet
}

type Pet {
    name: String
    lastTimeOutside: String
}
```

We can only use this `@cache` directive on fields in a GraphQL document, which contains operations.

```graphql
query myPet {
    pet {
        name
        lastTimeOutside @cache
    }
}
```

Directives can also have arguments. Let's add a `maxAge` argument, with a default value of 1000.

```graphql
# Argument with a default value
directive @cache(maxAge: Int = 1000) on FIELD
```

In a GraphQL document, we could use our updated `@cache` directive to specify a maxAge value:

```graphql
query myPet {
    pet {
        name
        lastTimeOutside @cache(maxAge: 500)
    }
}
```

All custom schema and operation directives don't have any effect until we implement new custom behavior. For example, the operation above where `lastTimeOutside` has a `@cache` directive behaves exactly the same as without it, until we have implemented some new logic. We'll demonstrate implementation of behavior for directives in the next section of this page.

Here is an operation directive with all possible eight locations in a GraphQL document, which contains operations.

```graphql
type @foo on QUERY | MUTATION | SUBSCRIPTION |
  FIELD | FRAGMENT_DEFINITION | FRAGMENT_SPREAD |
  INLINE_FRAGMENT | VARIABLE_DEFINITION

query someQuery(
    $var: String @foo # Variable definition
    ) @foo # Query
    {
        field @foo  # Field
        ... on Query @foo { # Inline fragment
            field
        }
        ...someFragment @foo # Fragment spread
}

fragment someFragment @foo { # Fragment
    field
}

mutation someMutation @foo { # Mutation
    field
}

subscription someSubscription @foo { # Subscription
    field
}
```

Although it is technically possible to define a directive that includes locations associated with schema and operation directives, in practice this is not common.

## Implementing logic for operation directives

Let's implement the logic for a `@cache` operation directive:

```graphql
directive @cache(maxAge: Int) on FIELD
```

This is an operation directive that enables clients to specify how recent cache entries must be. This is an example of an operation directive that can change execution.

For example, a client specifies that `hello` cache entries must not be older than 500 ms, otherwise we re-fetch these entries.

```graphql
query caching {
    hello @cache(maxAge: 500)
}
```

In GraphQL Java, operation directive definitions are represented as `GraphQLDirective`s. Operation directive usages are represented as `QueryAppliedDirective`s. Note that the word "query" here is misleading, as it actually refers to a directive that applies to any of the three GraphQL operations: queries, mutations, or subscriptions. Operation directives are still commonly referred to as "query" directives, hence the class name.

Usages of operation directives are represented in GraphQL Java as instances of `QueryAppliedDirective`, and provided argument values are represented as `QueryAppliedDirectiveArgument`.

We can access operation directives usage during execution via `getQueryDirectives()` in `DataFetchingEnvironment`. For example:

```java
DataFetcher<?> cacheDataFetcher = new DataFetcher<Object>() {
    @Override
    public Object get(DataFetchingEnvironment env) {
        QueryDirectives queryDirectives = env.getQueryDirectives();
        List<QueryAppliedDirective> cacheDirectives = queryDirectives
                .getImmediateAppliedDirective("cache");
        // We get a List, because we could have
        // repeatable directives
        if (cacheDirectives.size() > 0) {
            QueryAppliedDirective cache = cacheDirectives.get(0);
            QueryAppliedDirectiveArgument maxAgeArgument
                    = cache.getArgument("maxAge");
            int maxAge = maxAgeArgument.getValue();

            // Now we know the max allowed cache time and
            // can make use of it
            // Your logic goes here
        }
    }
};
```
