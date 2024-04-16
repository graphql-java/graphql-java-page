---
title: "Relay"
date: 2018-09-09T12:52:46+10:00
description: graphql-java has support for Relay
---
# Relay Support

Very basic support for [Relay](https://github.com/facebook/relay) is included.

Please look at [https://github.com/graphql-java/todomvc-relay-java](https://github.com/graphql-java/todomvc-relay-java) for a full example project.

Relay sends queries to the GraphQL server as JSON containing a ``query`` field and a ``variables`` field. The ``query`` field is a JSON string,
and the ``variables`` field is a map of variable definitions. A relay-compatible server will need to parse this JSON and pass the ``query``
string to this library as the query and the ``variables`` map as the third argument to ``execute`` as shown below.

```java
@RequestMapping(value = "/graphql", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
@ResponseBody
public Object executeOperation(@RequestBody Map body) {
    String query = (String) body.get("query");
    Map<String, Object> variables = (Map<String, Object>) body.get("variables");
    if (variables == null) {
        variables = new LinkedHashMap<>();
    }
    ExecutionResult executionResult = graphql.execute(query, (Object) null, variables);
    Map<String, Object> result = new LinkedHashMap<>();
    if (executionResult.getErrors().size() > 0) {
        result.put("errors", executionResult.getErrors());
        log.error("Errors: {}", executionResult.getErrors());
    }
    result.put("data", executionResult.getData());
    return result;
}
```

## Apollo Support

There is no special support for [Apollo](https://github.com/apollographql/apollo-client) included: Apollo works with any schema.

The Controller example shown above works with Apollo too.
