---
title: "Field Visibility"
date: 2019-02-12T12:00:00+10:00
draft: false
tags: [documentation]
weight: 109
description: How control the visibility of the fields defined in a schema
---

# Limiting Field Visibility

By default every field defined in a `GraphqlSchema` is available.  There are cases where you may want to restrict certain fields
depending on the user.

You can do this by using a `graphql.schema.visibility.GraphqlFieldVisibility` implementation and attaching it to the schema.

A simple `graphql.schema.visibility.BlockedFields` implementation based on fully qualified field name is provided.

{{< highlight java "linenos=table" >}}

        GraphqlFieldVisibility blockedFields = BlockedFields.newBlock()
                .addPattern("Character.id")
                .addPattern("Droid.appearsIn")
                .addPattern(".*\\.hero") // it uses regular expressions
                .build();

        GraphQLSchema schema = GraphQLSchema.newSchema()
                .query(StarWarsSchema.queryType)
                .fieldVisibility(blockedFields)
                .build();

{{< / highlight >}}


There is also another implementation that prevents instrumentation from being able to be performed on your schema, if that is a requirement.

Note that this puts your server in contravention of the graphql specification and expectations of most clients so use this with caution.


{{< highlight java "linenos=table" >}}

        GraphQLSchema schema = GraphQLSchema.newSchema()
                .query(StarWarsSchema.queryType)
                .fieldVisibility(NoIntrospectionGraphqlFieldVisibility.NO_INTROSPECTION_FIELD_VISIBILITY)
                .build();

{{< / highlight >}}

You can create your own derivation of `GraphqlFieldVisibility` to check what ever you need to do to work out what fields
should be visible or not.

{{< highlight java "linenos=table" >}}

    class CustomFieldVisibility implements GraphqlFieldVisibility {

        final YourUserAccessService userAccessService;

        CustomFieldVisibility(YourUserAccessService userAccessService) {
            this.userAccessService = userAccessService;
        }

        @Override
        public List<GraphQLFieldDefinition> getFieldDefinitions(GraphQLFieldsContainer fieldsContainer) {
            if ("AdminType".equals(fieldsContainer.getName())) {
                if (!userAccessService.isAdminUser()) {
                    return Collections.emptyList();
                }
            }
            return fieldsContainer.getFieldDefinitions();
        }

        @Override
        public GraphQLFieldDefinition getFieldDefinition(GraphQLFieldsContainer fieldsContainer, String fieldName) {
            if ("AdminType".equals(fieldsContainer.getName())) {
                if (!userAccessService.isAdminUser()) {
                    return null;
                }
            }
            return fieldsContainer.getFieldDefinition(fieldName);
        }
    }

{{< / highlight >}}