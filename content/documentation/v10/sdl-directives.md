---
title: "SDL Directives"
date: 2018-09-09T12:52:46+10:00
draft: false
tags: [documentation]
weight: 117
description: How SDL Directives can be used to adjust the behavior of your graphql API
---
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


{{< highlight graphql "linenos=table" >}}

    type Employee
        id : ID
        name : String!
        startDate : String!
        salary : Float
    }

{{< / highlight >}}


Publishing ``salary`` information to every one who can see this employee's ``name`` might not be want you want.  Rather you want some sort of access control
to be in place such that if your role is that of a manager, you can see salaries, otherwise you get no data back.

Directives can help you declare this more easily.  Our declaration above would become something like the following:


{{< highlight graphql "linenos=table" >}}
    directive @auth(role : String!) on FIELD_DEFINITION

    type Employee
        id : ID
        name : String!
        startDate : String!
        salary : Float @auth(role : "manager")
    }

{{< / highlight >}}

So we have said that only people who have the role ``manager`` are authorised to see this field.  We can now use this directive on ANY field
that needs manager role authorisation.


{{< highlight graphql "linenos=table" >}}
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
{{< / highlight >}}



We now need to wire in the code that can handle any field with this ``@auth`` directive.  We use ``graphql.schema.idl.SchemaDirectiveWiring`` to do this.



{{< highlight java "linenos=table" >}}
    class AuthorisationDirective implements SchemaDirectiveWiring {

        @Override
        public GraphQLFieldDefinition onField(SchemaDirectiveWiringEnvironment<GraphQLFieldDefinition> schemaDirectiveWiringEnv) {
            String targetAuthRole = (String) schemaDirectiveWiringEnv.getDirective().getArgument("role").getValue();

            GraphQLFieldDefinition field = schemaDirectiveWiringEnv.getElement();
            //
            // build a data fetcher that first checks authorisation roles before then calling the original data fetcher
            //
            DataFetcher originalDataFetcher = field.getDataFetcher();
            DataFetcher authDataFetcher = new DataFetcher() {
                @Override
                public Object get(DataFetchingEnvironment dataFetchingEnvironment) {
                    Map<String, Object> contextMap = dataFetchingEnvironment.getContext();
                    AuthorisationCtx authContext = (AuthorisationCtx) contextMap.get("authContext");

                    if (authContext.hasRole(targetAuthRole)) {
                        return originalDataFetcher.get(dataFetchingEnvironment);
                    } else {
                        return null;
                    }
                }
            };
            //
            // now change the field definition to have the new authorising data fetcher
            return field.transform(builder -> builder.dataFetcher(authDataFetcher));
        }
    }

    //
    // we wire this into the runtime by directive name
    //
    RuntimeWiring.newRuntimeWiring()
            .directive("auth", new AuthorisationDirective())
            .build();

{{< / highlight >}}

This has modified the ``GraphQLFieldDefinition`` so that its original data fetcher will ONLY be called if the current authorisation context
has the ``manager`` role.  Exactly what mechanisms you use for authorisation is up to you.  You could use Spring Security for example say, graphql-java doesnt
really care.

You would provide this authorisation checker into the execution "context" object of the graphql input so it can then be accessed later in the
``DataFetchingEnvironment``.

{{< highlight java "linenos=table" >}}
    AuthorisationCtx authCtx = AuthorisationCtx.obtain();

    ExecutionInput executionInput = ExecutionInput.newExecutionInput()
            .query(query)
            .context(authCtx)
            .build();



{{< / highlight >}}

## Declaring Directives

In order to use a directive in SDL, the graphql specification requires that you MUST declare its shape before using it.  Our ``@auth`` directive example above needs to be
declared like so before use.

{{< highlight graphql "linenos=table" >}}
    # This is a directive declaration
    directive @auth(role : String!) on FIELD_DEFINITION

    type Employee
        id : ID

        # and this is a usage of that declared directive
        salary : Float @auth(role : "manager")
    }
{{< / highlight >}}


The one exception to this is the ``@deprecated`` directive which is implicitly declared for you as follows :


{{< highlight graphql "linenos=table" >}}
        directive @deprecated(  reason: String = "No longer supported") on FIELD_DEFINITION | ENUM_VALUE

{{< / highlight >}}


The valid SDL directive locations are as follows :

{{< highlight graphql "linenos=table" >}}
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
{{< / highlight >}}



Directives are commonly applied to fields definitions but as you can see there are a number of places they can be applied.


## Another Example - Date Formatting

Date formatting is a cross cutting concern that we should only have to write once and apply it in many areas.

The following demonstrates an example schema directive that can apply date formatting to fields that are ``LocaleDate`` objects.

Whats great in this example is that it adds an extra ``format`` argument to each field that it is applied to.  So the clients can
opt into what ever date formatting you provide per request.

{{< highlight graphql "linenos=table" >}}
    directive @dateFormat on FIELD_DEFINITION

    type Query {
        dateField : String @dateFormat
    }
{{< / highlight >}}

Then our runtime code could be :

{{< highlight java "linenos=table" >}}

    public static class DateFormatting implements SchemaDirectiveWiring {
        @Override
        public GraphQLFieldDefinition onField(SchemaDirectiveWiringEnvironment<GraphQLFieldDefinition> environment) {
            GraphQLFieldDefinition field = environment.getElement();
            //
            // DataFetcherFactories.wrapDataFetcher is a helper to wrap data fetchers so that CompletionStage is handled correctly
            // along with POJOs
            //
            DataFetcher dataFetcher = DataFetcherFactories.wrapDataFetcher(field.getDataFetcher(), ((dataFetchingEnvironment, value) -> {
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
            return field.transform(builder -> builder
                    .argument(GraphQLArgument
                            .newArgument()
                            .name("format")
                            .type(Scalars.GraphQLString)
                            .defaultValue("dd-MM-YYYY")
                    )
                    .dataFetcher(dataFetcher)
            );
        }

        private DateTimeFormatter buildFormatter(String format) {
            String dtFormat = format != null ? format : "dd-MM-YYYY";
            return DateTimeFormatter.ofPattern(dtFormat);
        }
    }

    static GraphQLSchema buildSchema() {

        String sdlSpec = "" +
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

{{< / highlight >}}

Notice the SDL definition did not have a ``format`` argument yet once the directive wiring is applied, it is added
to the field definition and hence clients can begin to use it.

Please note that graphql-java does not ship with this implementation.  It is merely provided here as
an example of what you could add yourself.


## Chaining Behaviour

The directives are applied in the order they are encountered.  For example imagine directives that changed the case of a field value.

{{< highlight graphql "linenos=table" >}}

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

{{< / highlight >}}

When the above was executed each directive would be applied one on top of the other.  Each directive implementation should be careful
to preserve the previous data fetcher to retain behaviour (unless of course you mean to throw it away)


