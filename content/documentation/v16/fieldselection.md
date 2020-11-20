---
title: "Field selection"
date: 2018-09-09T12:52:46+10:00
draft: false
tags: [documentation]
weight: 109
description: How you can efficiently look ahead at the selected fields lower in the query
---
# Field Selection

Field selection occurs when you have a compound type (an object or interface type) and you select a set of sub fields
from that type.

For example given the following query :

{{< highlight graphql "linenos=table" >}}

    query {
        user(userId : "xyz")  {
            name
            age
            weight
            friends {
                name
            }
        }
    }

{{< / highlight >}}

The field selection set of the ``user`` field is ``name``, ``age``, ``weight``, ``friends`` and ``friends/name``

Knowing the field selection set can help make ``DataFetcher``s more efficient.  For example in the above query
imagine that the ``user`` field is backed by an SQL database system.  The data fetcher could look ahead into the field selection
set and use different queries because it knows the caller wants friend information as well as user information.

``graphql.schema.DataFetchingFieldSelectionSet`` is used to represent this field selection set.  It gives you maps
of the fields and their ``graphql.schema.GraphQLFieldDefinition``s and argument values.


{{< highlight java "linenos=table" >}}

        DataFetcher smartUserDF = new DataFetcher() {
            @Override
            public Object get(DataFetchingEnvironment env) {
                String userId = env.getArgument("userId");

                DataFetchingFieldSelectionSet selectionSet = env.getSelectionSet();
                if (selectionSet.contains("user/*")) {
                    return getUserAndTheirFriends(userId);
                } else {
                    return getUser(userId);
                }
            }
        };

{{< / highlight >}}

A glob path matching system is used for addressing fields in the selection.  Its based on ``java.nio.file.FileSystem#getPathMatcher``
as an implementation.

This will allow you to use ``*``, ``**`` and ``?`` as special matching characters such that ``invoice/customer*`` would
match an ``invoice`` field with child fields that start with ``customer``.  Each level of field is separated by ``/`` just like
a file system path.

There are methods that allow you to get more detailed information about the fields in the selection set.  For example
if you are using [Relay](https://facebook.github.io/relay/docs/en/graphql-server-specification.html) often you want to know what fields have
been request in the ``Connection`` section of the query.

So given a query like:

{{< highlight graphql "linenos=table" >}}

    query {
        users(first:10)  {
            edges {
                node {
                    name
                    age
                    weight
                    friends {
                        name
                    }
                }
            }
        }
    }

{{< / highlight >}}


you can write code that gets the details of each specific field that matches a glob.


{{< highlight java "linenos=table" >}}

        DataFetchingFieldSelectionSet selectionSet = env.getSelectionSet();
        List<SelectedField> nodeFields = selectionSet.getFields("edges/nodes/*");
        nodeFields.forEach(selectedField -> {
            System.out.println(selectedField.getName());
            System.out.println(selectedField.getFieldDefinition().getType());

            DataFetchingFieldSelectionSet innerSelectionSet = selectedField.getSelectionSet();
            // this forms a tree of selection and you can get very fancy with it
        }


{{< / highlight >}}


# Unions and Interfaces

If the field is a union or iterface type then it is not possible to know exactly that concrete object type the result will be BEFORE the
field is resolved into a value.

There in fact be multiple possible `conditional` fields.

This is represented a list of possible fields and having two addressing mechanisms, a simple `x/y` one and the more specific `Foo.x/Bar.y` mechanism.

For example imagine a `Pet` interface type that has `Cat` and `Dog` object type implementations. The query might be:
    
{{< highlight graphql "linenos=table" >}}

  {
      pet {
          name
      }
  }

{{< / highlight >}}
 
   
In the example above you have a `Cat.name`and `Dog.name` as possible sub selections of the `pet` field. They are can be addressed by either `name` or `Dog.name` or `Cat.name`
    
{{< highlight java "linenos=table" >}}

  selectionSet.contains("name") == true
  selectionSet.contains("Dog.name", "Cat.name") == true

  List<SelectedField> petNames = selectionSet.getFields("name")
  petNames.size() == 2

  List<SelectedField> dogNames = selectionSet.getFields("Dog.name")
  dogNames.size() == 1
  
{{< / highlight >}}

   
The simple naming is easier to work with but the type prefixed naming is more precise.

# Field names and Aliasing

Another complication is any field aliasing that a client can specify.
    
{{< highlight graphql "linenos=table" >}}
  {
      pet {
          name(arg : "foo")
          ... on Dog {
             aliasedName : name(arg : "bar")
          }
     }
  }
{{< / highlight >}}
 
   
In the example above the `selectionSet.getFields("name")` actually returns three SelectedFields, one 
for `Dog.name`, one for `Cat.name` and one for `Dog.name` with an alias of `aliasedName`. 

The arguments can differ on `SelectedField`s that have different `SelectedField.getResultKey()`s, hence the multiple selected fields returned.

To help you there is the `getFieldsGroupedByResultKey()` that returns a `Map<String,List<SelectedField>>` keyed by result key, that is by the field alias 
or by the field name.

