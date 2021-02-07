+++
title = "A comprehensive guide to GraphQL API changes"
author = "Andreas Marek"
tags = []
categories = []
date = 2022-02-07T00:00:00+10:00
toc = "true"
+++

__Note: this guide aims to be an update document which will be updated if needed.__

# Breaking changes

They type system of GraphQL gives you confidence what the shape of your API is: 
which data to expect from each field, which field can be null or not etc.
This is great, but an API is rarely absolutely fixed, but rather continues to evolve over time.

The beauty of the type system is that not every change is equal, but some are perfectly fine 
and others you might want to try to avoid. The most obvious dual classification distinguishes between
a breaking change and a non-breaking change. While this makes sense at first glance, it is to simplistic
to cover all differente changes that can happen.

We will look at the existing definitions and then classify all different changes in detail.

# GraphQL Spec definition of breaking 
The [GraphQL spec](https://spec.graphql.org/draft/#sec-Validation.Type-system-evolution) says the following:

> Any change that can cause a previously valid request to become invalid is considered a breaking change.

Every GraphQL request is either considered valid or invalid. If a request is invalid it will not be executed.
This definition of breaking change would cover the following change:

Original schema:
{{< highlight TypeScript "linenos=table" >}}
type Query {
  name:String
}
{{< / highlight >}}
<p/>
New Schema:
{{< highlight TypeScript "linenos=table" >}}
type Query {
  newName:String
}
{{< / highlight >}}
<p/>

Now the previously valid query `{name}` would become invalid because there is no top-level field `name` anymore.
This is clearly a breaking change.

But what about this:

Original schema:
{{< highlight TypeScript "linenos=table" >}}
type Query {
  name:String!
}
{{< / highlight >}}
<p/>
New Schema:
{{< highlight TypeScript "linenos=table" >}}
type Query {
  name:String
}
{{< / highlight >}}
<p/>

Here the type of `name` was changed from non-nullable to nullable: `String!` => `String`.
Now `{name}` is still a valid query which would be executed without error. In general this is also
considered a breaking change, because the old schema assured that client that `name` could never be null,
but now it can. Every change like this where the type system guarantees less, is considered a breaking 
change.

This example shows that the definition of breaking change in the spec doesn't cover all the cases 
we are interested in.

# GraphQL.js definition of breaking change
The next good thing after the spec is the JavaScript reference implementation.
GraphQL.js [contains a function](https://github.com/graphql/graphql-js/blob/main/src/utilities/findBreakingChanges.js) 
`findBreakingChanges` which compares an old and a new schema and returns
a list of breaking and dangerous changes.

Unfortunately the functions code itself doesn't make clear what breaking or dangerous means exactly, but
the discussion in the two issues [#992](https://github.com/graphql/graphql-js/pull/992) and 
[#968](https://github.com/graphql/graphql-js/issues/968) shed some light on it:

>The above is with the assumption that "dangerous change" means 
>"it could affect your client if you built things poorly (i.e. didn't provide a default in a switch statement), 
>but won't affect clients built with the concept of GraphQL breaking changes in mind".
>  
>Basically: if something breaks due to a "dangerous change" there's some underlying, 
>root issue on your client you should dig in and fix so future changes don't cause 
>that problem. But not coding defensively can lead to these issues. Whereas if you make a 
>"breaking change" it's expected that clients won't be able to handle it correctly.

<p/>

>When building clients, it's best to be defensive against possible future expansions and handle 
>those cases. For enums, we typically include an else or switch default clause when branching on 
>them to handle cases the client doesn't know about. If your clients aren't programming defensively 
>like this, then it's true that expanding the possible response values could cause issues for those 
>clients - it's not an entirely safe change.

This basically means that you take client side development considerations into account and 
not only the guarantees of the type system itself.

For example as described above: adding a value to an Enum is a non breaking change 
if you just look at the schema itself, 
but it could lead to problems if the clients are not developed with the possibilities 
of new Enum values in mind.

And while the list provided by GraphQL.js is much more detailed than the short 
definition in the spec, the nuances are not really obvious, it is only available as code
and sometimes it could be more specific.

For example removing a Directive is not always a breaking change if the Directive
is never used at a Query element or adding an argument which is required is not breaking
if the argument has a default value.

# Comprehensive list of changes with explanation

This sections aims to provide a comprehensive list of changes and
what consequence each change have.

Same naming conventions:


- the type of a type is called kind. It can be Enum, 
Scalar, Input Object, Object, Interface or Union.
- Argument means arguments for fields and for Directives if
not explicitly mentioned otherwise.
- Query location means a location for a Directive in a Query (eg. field)   
- Schema location means a location for a Directive in SDL (eg.  field definition)
- Query Directive is a Directive which is a valid for locations in a Query
- Schema Directive is a Directive which is a valid for locations in a SDL
- Input types are Scalar, Enum, Input Objects.
- Output types are Scalar, Enum, Object, Interfaces and Union.

List of changes:

## 1. A type is removed.
When a type is removed every Query which directly uses the type by name becomes invalid.
For input types this means a variable declaration becomes invalid:

{{< highlight Scala "linenos=table" >}}
query($var: InputTypeWhichIsRemoved) {
# more 
}
{{< / highlight >}}

For composite output types every query which uses the type as type condition becomes invalid: 
{{< highlight Scala "linenos=table" >}}
{
 ... on TypeWhichIsRemoved {
 }
}
{{< / highlight >}}

When a Scalar or Enum which is used as output type is removed it means the field
which returns this Scalar or Enum is either removed or changed in a breaking way.

## 2. The kind of a type is changed.

Changing the kind of a type means fundamentally changing the guarantee about this type.

Open discussion: changing an Object (which was not used as type in an Union) 
is maybe not breaking?

## 3. A type of an Union is removed.

Every request which queried the type via Fragment becomes invalid.
{{< highlight Scala "linenos=table" >}}
{ unionField {
   ... on TypeWhichIsRemoved {
    # more
   }
 }
}
{{< / highlight >}}

## 4. A value is removed from an Enum which is used as input.

Every request which used the value becomes invalid.

## 5. A required input field or argument is added which doesn't have a default value.

Every request which queried the field becomes invalid because the required
argument or input field is not provided.

## 6. An Interface is removed from an Object or Interface.

Every request which queried the type via Fragment becomes invalid.

## 7. An argument or input field is removed.

Every request which provided the argument or input field becomes invalid.

## 8. An argument type or input field is changed in an incompatible way.

Any change which is not just removing non-nullable constraints is breaking.

TODO: more explanation.

## 9. A Query Directive was removed. 

Every request which used the Directive becomes invalid.

## 10. A Query Directive was changed from repeatable to not repeatable.

Every request which provided multiple instances of the Directive on the same element 
becomes invalid.

## 11. A Query location for a Query Directive was removed. 

Every request which has the Directive on the now removed location becomes invalid.

## 12. A value is added to an Enum.

If a client is not developed in defensive way which expects new Enum values
it can cause problems.

## 13. Default value for argument or input field is changed 

Every request which didn't provide any value for this argument
or input field is now using the new default value. 

# Characteristics of each change

As discussed above there are different aspects to a change we should consider:

- Will it make previously valid queries invalid
- Does it weaken or fundamentally changes the guarantees of the schema
- Could it be problematic for clients

| Change                               | Causes invalid queries | Less/incompatible guarantees | Maybe problematic for clients |
|--------------------------------------|------------------------|------------------------------|-------------------------------|
| #1 Type removed                      | yes                    | na                           | na                            |
| #2 Kind changed                      | yes                    | yes                          | na                            |
| #3 Union type removed                | yes                    | no                           | na                            |
| #4 Input Enum value removed          | yes                    | no                           | na                            |
| #5 Required input added              | yes                    |                              |                               |
| #6 Interface removed                 | yes                    |                              |                               |
| #7 Argument/Input field removed      | yes                    |                              |                               |
| #8 Argument/Input field type changed | yes                    |                              |                               |
| #9 Query directive removed           | yes                    |                              |                               |
| #10 Query directive non-repeatable   | yes                    |                              |                               |
| #11 Query directive location removed | yes                    |                              |                               |
| #12 Value added to Enum              | no                     | no                           | yes                           |
| #13 Default value changed            | no                     | no                           | yes                           |


# Feedback or questions
We use [GitHub Discussions](https://github.com/graphql-java/graphql-java/discussions) for general feedback and questions.

You can also checkout our [Workshops](/workshops) for more possibilities to learn GraphQL Java.




