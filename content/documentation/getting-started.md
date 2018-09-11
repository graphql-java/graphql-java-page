---
title: "Getting started"
date: 2018-09-09T12:52:46+10:00
draft: false
tags: [introduction]
---
`graphql-java` requires at least Java 8.

How to use the latest release with Gradle
Make sure mavenCentral is among your repos:

{{< highlight groovy "linenos=table" >}}
repositories {
    mavenCentral()
}
{{< / highlight >}}

Dependency:

{{< highlight groovy "linenos=table" >}}
dependencies {
  compile 'com.graphql-java:graphql-java:9.0'
}
{{< / highlight >}}


