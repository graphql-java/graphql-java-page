+++
title = "A comprehensive guide to GraphQL API changes"
author = "Andreas Marek"
tags = []
categories = []
date = 2021-02-07T00:00:00+10:00
toc = "true"
draft = "true"
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

# Comprehensive list of changes 

This sections aims to provide a comprehensive list of changes and
what consequence each change have.

Same naming conventions:

- the type of a type is called kind. It can be Enum, 
Scalar, Input Object, Object, Interface or Union.
- Argument means arguments for fields and for Directives if
not explicitly mentioned otherwise.
- Query location means a location for a Directive in a Query (eg. field)   
- Schema location means a location for a Directive in a SDL (eg.  field definition)
- Query Directive is a Directive which is a valid for locations in a Query
- Schema Directive is a Directive which is a valid for locations in a SDL
- Input types are Scalar, Enum, Input Objects.
- Output types are Scalar, Enum, Object, Interfaces and Union.
- Composite types are types of kind Object, Interface, Union or Input Object
- Atomic types are types of kind Scalar and Enum
- Wrapping types are Non-Null types and List types which wrap other types 

This is the full list of schema changes we consider:

- 1 change Object
    - 1.1 remove field
    - 1.2 change field
        - 1.2.1 change type
        - 1.2.2 add argument 
        - 1.2.3 remove argument
        - 1.2.4 change argument
            - 1.2.4.1 change argument type  
            - 1.2.4.2 add default value
            - 1.2.4.3 remove default value
            - 1.2.4.4 change default value
    - 1.3 add Interface
    - 1.4 remove Interface
- 2 change Interface
    - 2.1 remove field
    - 2.2 change field
        - 2.2.1 change type 
        - 2.2.2 add argument 
        - 2.2.3 remove argument
        - 2.2.4 change argument
            - 2.2.4.1 change argument type  
            - 2.2.4.2 add default value
            - 2.2.4.3 remove default value
            - 2.2.4.4 change default value
    - 2.3 add Interface
    - 2.4 remove Interface
- 3 change Union
    - 3.1 add member type
    - 3.2 remove member type
- 4 change Input Object 
    - 4.1 add non-nullable field without default value
    - 4.2 remove field 
    - 4.3 change field
        - 4.3.1 change type 
        - 4.3.2 add default value
        - 4.3.3 remove default value
        - 4.3.4 change default value
- 5 change Enum
    - 5.1 add value
    - 5.2 remove value
- 6 change Scalar
    - 6.1 change or remove specified-by value 
- 7 change Query Directive
    - 7.1 make it non repeatable  
    - 7.2 remove Query location
    - 7.3 add argument 
    - 7.4 remove argument
    - 7.5 change argument
        - 7.5.1 change argument type  
        - 7.5.2 add default value
        - 7.5.3 remove default value
        - 7.5.4 change default value
        
- 8 Add/remove not directly referenced Object/Interface hierarchies 

As a general rule we do not consider changes which results in invalid schemas.
An obvious example is changing an Input object type to an Interface type.
Further more not every change is applicable to every schema: e.g. changing an argument
requires an argument in the first place.

We also don't discuss changes considered safe like adding a new field to an Object.


## Type changes for output field types

### A composite type changed to an atomic type or vice versa

Every request querying this field becomes invalid because 
composite types require sub selection and atomic types don't allow them.

### One or more non-nullable guarantees removed 

This doesn't change the shape of the type but weakens the guarantees 
by the type system which elements can be null.

For example: `String!` changed to `String` or `[[[String!]!]!` changed to
`[String]!]`

### One or more List wrapping types added or removed.

### Union type changed to an Object or Interface 

### Object type changed to an Interface

### Interface type changed to an Object

### Scalar replaced with Enum or vice versa

## 1. Object changes

| Change              | Invalid queries | Less/incompatible guarantees | Maybe problematic for existing clients |
|----------------------|-------|---------|------------------|
| 1.1 remove field | yes                                | - | - |
| 1.2.1 change field type | maybe | maybe | yes |
| 1.2.2 add argument| yes |- | - |
| 1.2.3 remove argument | yes |- | - |
| 1.2.4.1 change argument type | maybe | - | yes |
| 1.2.4.2 add argument default value | no | no | yes |
| 1.2.4.3 remove default value | maybe | - | - |
| 1.2.4.4 change default value  | no | no | yes |
| 1.3 add Interface  | no | no | yes |
| 1.4 remove Interface  | yes | - | - |
<p/>


## 2. Interface changes

| Change              | Invalid queries | Less/incompatible guarantees | Maybe problematic for existing clients |
|----------------------|-------|---------|------------------|
| 2.1 remove field | yes                                | - | - |
| 2.2.1 change field type | likely | maybe | yes |
| 2.2.2 add argument| yes |- | - |
| 2.2.3 remove argument | yes |- | - |
| 2.2.4.1 change argument type | maybe | - | yes |
| 2.2.4.2 add argument default value | no | no | yes |
| 2.2.4.3 remove default value | maybe | - | - |
| 2.2.4.4 change default value  | no | no | yes |
| 2.3 add Interface  | no | no | yes |
| 2.4 remove Interface  | yes | - | - |
<p/>

## 3. Union changes

| Change              | Invalid queries | Less/incompatible guarantees | Maybe problematic for existing clients |
|----------------------|-------|---------|------------------|
| 3.1 add member type| no | no |yes
| 3.2 remove member type | yes | - | -
<p/>

## 4. Input Object changes

| Change              | Invalid queries | Less/incompatible guarantees | Maybe problematic for existing clients |
|----------------------|-------|---------|------------------|
| 4.1 add field | maybe | no | - |
| 4.2 remove field | yes | - | - |
| 4.3.1 change field type | likely | - | yes |
| 4.3.2 add field default type | likely | - | yes |
| 4.3.3 add field default type | likely | - | yes |
| 4.3.4 change field default type | no | no | yes |
<p/>


## 5. Enum changes

| Change              | Invalid queries | Less/incompatible guarantees | Maybe problematic for existing clients |
|----------------------|-------|---------|------------------|
| 5.1 add value | maybe | no | - |
| 5.2 remove value | maybe | no | - |
<p/>

## 6. Scalar changes

| Change              | Invalid queries | Less/incompatible guarantees | Maybe problematic for existing clients |
|----------------------|-------|---------|------------------|
| 6.1 change or remove specified-by value | no | - | yes |
<p/>

## 7. Query Directive changes

| Change              | Invalid queries | Less/incompatible guarantees | Maybe problematic for existing clients |
|----------------------|-------|---------|------------------|
| 7.1 make it non repeatable | yes | - | - |
| 7.2 remove Query location | yes | - | - |
| 7.3 add argument | maybe | - | - |
| 7.4 remove argument | yes | - | - |
| 7.5.1 change argument type | maybe | - | yes |
| 7.5.2 add argument default value | no | no | yes |
| 7.5.3 remove default value | maybe | - | - |
| 7.5.4 change default value  | no | no | yes |
<p/>


## 8 Add/remove not directly referenced Object/Interface hierarchies 



# Foo    
### 1.1 remove field 

## 1. A type is removed
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

## 2. A type is replaced with another type of same name (The kind of a type is changed)

### 2A: A composite output type is replaced with an atomic type or vice versa

This causes invalid queries as a composite type requires sub selection, while
atomic types don't allow them. 

### 2B: An Input Object is replaced with an atomic type or vice versa 

This causes invalid queries as the values of an input object are not
compatible with Enum or Scalar values. One exception is when an Input Object is replaced
with a custom Scalar which allows the same values as the Input Object.

### 2C: A Object or Interface is replaced with a Union 

This causes invalid queries because Object and Interface allow direct sub selection
(with using a Fragment), while Unions don't.

### 2D: A Union is replaced with an Object or Interface 

### 2E: An Object is replaced with an Interface

### 2F: An Interface is replaced with an Object

## 3. A member type of a Union is removed

Every request which queried the type via Fragment becomes invalid.
{{< highlight Scala "linenos=table" >}}
{ unionField {
   ... on TypeWhichIsRemoved {
    # more
   }
 }
}
{{< / highlight >}}

## 4. A value is removed from an Enum which is used as input

Every request which used the value becomes invalid.

## 5. A required input field or argument is added which doesn't have a default value


## 6. A field is removed 

Every request which queried the failed becomes invalid.

## 7. The type of a field is changed

### 7A: A composite type is changed to an atomic type (and vice versa)

Every request querying this field becomes invalid because 
composite types require sub selection and atomic types don't allow them.

### 7B: One or more non-nullable wrapping types are removed 

This doens't change the shape of the type but weakens the guarantees 
by the type system which elements can be null.

For example: `String!` changed to `String` or `[[[String!]!]!` changed to
`[String]!]`

### 7C: One or more List wrapping types are added or removed.

### 7D: A Union type is changed to an Object or Interface 

### 7E: An Object type is changed to an Interface

### 7F: An Interface type is changed to an Object

## 8. An Interface is removed from an Object or Interface

Every request which queried the type via Fragment becomes invalid.

## 9. An argument or input field is removed

Every request which provided the argument or input field becomes invalid.

## 10. An argument type is changed

### 10A: The type changed to non-nullable without default value 

Every request which queried the field becomes invalid because the required
argument or input field is not provided.

### 10B:

Any change which is not just removing non-nullable constraints is breaking.

TODO: more explanation.

## 11. A Query Directive is removed 

Every request which used the Directive becomes invalid.

## 12. A Query Directive is changed from repeatable to not repeatable

Every request which provided multiple instances of the Directive on the same element 
becomes invalid.

## 13. A Query location for a Query Directive is removed 

Every request which has the Directive on the now removed location becomes invalid.

## 14. A value is added to an Enum

If a client doesn't expect new Enum values it can cause problems.
For example a switch over all Enum values is not able to handle a
new unknown value.

## 15. A type is added to a Union

If a client doesn't expect that Union members can grow, it can cause problems.

For example a query over all Union members:
{{< highlight Scala "linenos=table" >}}
{ unionField {
    ... on Member1{
      # more
    }
    ... on Member2{
      # more
    }
    ... on Member3{
      # more
    }
}
{{< / highlight >}}

When at development time the Union only consist of 3 member types,
but is expanded later the query above will result in empty Objects for these
new types. If a client might not be able to handle that. 

## 16. A Default value for argument or input field is changed

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
| #6 Required input added              | yes                    |                              |                               |
| #7 Required input added              | yes                    |                              |                               |
| #8 Interface removed                 | yes                    |                              |                               |
| #9 Argument/Input field removed      | yes                    |                              |                               |
| #10 Argument/Input field type changed | yes                    |                              |                               |
| #11 Query directive removed           | yes                    |                              |                               |
| #12 Query directive non-repeatable   | yes                    |                              |                               |
| #13 Query directive location removed | yes                    |                              |                               |
| #14 Value added to Enum              | no                     | no                           | yes                           |
| #15 Type added to Enum               | no                     | no                           | yes                           |
| #16 Default value changed            | no                     | no                           | yes                           |


# Feedback or questions

If you find something that is wrong or could be improved please consider opening a PR
[here](https://github.com/graphql-java/graphql-java-page/blob/master/content/blog/api-changes.md). 

We use [GitHub Discussions](https://github.com/graphql-java/graphql-java/discussions) for general feedback and questions.

You can also checkout our [Workshops](/workshops) for more possibilities to learn GraphQL and GraphQL Java.





