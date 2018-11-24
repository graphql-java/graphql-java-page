+++
title = "Introducing graphql-java-extended-scalars"
author = "Brad Baker"
tags = []
categories = []
date = 2018-11-24T01:00:00+10:00
+++

One of the most common questions we get in graphql-java land is "can we have a datetime scalar".

This is not defined by the graphql specification per se so we are reluctant to add it to the core library and then have it turn
up later as an officially specified type.

But it really is a badly needed type in your graphql arsenal and hence graphql-java-extended-scalars was born 

https://github.com/graphql-java/graphql-java-extended-scalars

This will be a place where we can add non standard but useful extensions to graphql-java.

The major scalars we have added on day one are

 * The aforementioned DateTime scalar as well as a Date and Time scalar
 * A Object scalar or sometimes know as a JSON scalar that allows a map of values to be returned as a scalar value
 * Some numeric scalars that constrain the values allowed such as `PositiveInt`
 * A Regex scalar that allows a string to fit a regular expression
 * A Url scalar that produces `java.net.URL` objects at runtime 
 * And finally an aliasing technique that allows you to create more meaningfully named scalar values
 
 We hope you find them useful. 


Cheers,<br>
Brad