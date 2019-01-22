+++
title = "GraphQL Deep Dive - Part 1: merged fields"
author = "Andreas Marek"
tags = []
categories = []
date = 2019-01-22T00:00:00+10:00
+++

# GraphQL Deep Dive series 

Welcome to the new series "GraphQL deep dive" where we will explore advanced or unknown GraphQL topics. The plan is to discuss things mostly in a language and implementation neutral way, even if it is hosted on graphql-java.com. 

# Merged Fields

First thing we are looking at is "merged fields".

GraphQL allows for a field to be declared multiple times in a query as long as it can be merged.

Valid GraphQL queries are:

{{< highlight Scala "linenos=table" >}}
{
  foo
  foo
}
{{< / highlight >}}

<p/>

{{< highlight Scala "linenos=table" >}}
{
  foo(id: "123")
  foo(id: "123")
  foo(id: "123")
}
{{< / highlight >}}
<p/>

{{< highlight Scala "linenos=table" >}}
{
  foo(id: "123") {
    id
  }
  foo(id: "123") {
    name
  }
  foo(id: "123") {
    id 
    name
  }
}
{{< / highlight >}}

Each of these queries will result in a result with just one "foo" key, not two or three. 

Invalid Queries are:

{{< highlight Scala "linenos=table" >}}
{
  foo
  foo(id: "123")
}
{{< / highlight >}}
<p/>
{{< highlight Scala "linenos=table" >}}
{
  foo(id: "123")
  foo(id: "456", id2: "123")
}
{{< / highlight >}}
<p/>
{{< highlight Scala "linenos=table" >}}
{
  foo(id: "123")
  foo: foo2
}
{{< / highlight >}}

The reason why they are not valid, is because the fields are different: in the first two examples the arguments differ and the third query actually has two different fields under the same key.

# Motivation

The examples so far don't seem really useful, but it all makes sense when you add fragments:

{{< highlight Scala "linenos=table" >}}
{
  ...myFragment1
  ...myFragment2
}

fragment myFragment1 on Query {
  foo(id: "123") {
    name
  }
}
fragment myFragment2 on Query {
  foo(id: "123") {
    url
  }
}

{{< / highlight >}}

<p/>
Fragments are designed to be written by different parties (for example different components in a UI) which should not know anything about each other. Requiring that every field can only be declared once would make this objective unfeasible.  

But by allowing fields merging, as long as the fields are the same, allows fragments to be authored in an independent way from each other.


# Rules when fields can be merged

The specific details when fields can be merged are written down in [Field Selection Merging](https://facebook.github.io/graphql/draft/#sec-Field-Selection-Merging) in the spec.

The rules are what you would expect in general and they basically say that fields must be the same. The following examples are taken from the spec and they are all valid:

{{< highlight Scala "linenos=table" >}}
fragment mergeIdenticalFields on Dog {
  name
  name
}
fragment mergeIdenticalAliasesAndFields on Dog {
  otherName: name
  otherName: name
}
fragment mergeIdenticalFieldsWithIdenticalArgs on Dog {
  doesKnowCommand(dogCommand: SIT)
  doesKnowCommand(dogCommand: SIT)
}
fragment mergeIdenticalFieldsWithIdenticalValues on Dog {
  doesKnowCommand(dogCommand: $dogCommand)
  doesKnowCommand(dogCommand: $dogCommand)
}
{{< / highlight >}}

The most complex case happens when you have fields in fragments on different types:

{{< highlight Scala "linenos=table" >}}
fragment safeDifferingFields on Pet {
  ... on Dog {
    volume: barkVolume
  }
  ... on Cat {
    volume: meowVolume
  }
}
{{< / highlight >}}

This is normally invalid because `volume` is an alias for two different fields `barkVolume` and `meowVolume` but because only one of the some are actually resolved and they both return a value of the same type (we assume here that `barkVolume` and `meowVolume` are both of the same type) it is valid.

{{< highlight Scala "linenos=table" >}}
fragment safeDifferingArgs on Pet {
  ... on Dog {
    doesKnowCommand(dogCommand: SIT)
  }
  ... on Cat {
    doesKnowCommand(catCommand: JUMP)
  }
}
{{< / highlight >}}

This is again a valid case because even if the first `doesKnowCommand` has a different argument than the second `doesKnowCommand` only one of them is actually resolved.

In the next example `someValue` has different types (we assume that `nickname` is a `String` and `meowVolume` is a `Int`) and therefore the query is not valid:

{{< highlight Scala "linenos=table" >}}
fragment conflictingDifferingResponses on Pet {
  ... on Dog {
    someValue: nickname
  }
  ... on Cat {
    someValue: meowVolume
  }
}
{{< / highlight >}}

# Sub selections and directives

One thing to keep in my mind is that the sub selections of fields are merged together. For example here `foo` is resolved once and than `id` and `name` is resolved.

{{< highlight Scala "linenos=table" >}}
{
  foo(id: "123") {
    id
  }
  foo(id: "123") {
    name
  }
}
{{< / highlight >}}

This query is the same as:

{{< highlight Scala "linenos=table" >}}
{
  foo(id: "123") {
    id
    name
  }
}
{{< / highlight >}}

The second thing to keep in mind is that different directives can be on each field:

{{< highlight Scala "linenos=table" >}}
{
  foo(id: "123") @myDirective {
    id
  }
  foo(id: "123") @myOtherDirective {
    name
  }
}
{{< / highlight >}}

So if you want to know all directives for the current field you are resolving you actually need to look at all of the merged fields from the query.

# Merged fields in graphql-js and GraphQL Java

In graphql-js merged fields are relevant when you implement a resolver and you need access to the specific ast field of the query. The `info` objects has a property `fieldNodes` which gives you access to all ast fields which are merged together.

In GraphQL Java depending on the version you are running you have `List<Field> getFields()` in the `DataFetcherEnvironment` or for GraphQL Java newer than `12.0` you have also `MergedField getMergedField()` which is the recommend way to access all merged fields.

