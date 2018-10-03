---
title: "Getting started"
date: 2018-09-09T12:52:46+10:00
draft: false
tags: [documentation]
weight: 100
description: GraphQL basics. Start here if you're new to GraphQL :-) 
---
# Getting started

`graphql-java` requires at least Java 8.


## How to use the latest release with Gradle

Make sure ``mavenCentral`` is among your repos:

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


## How to use the latest release with Maven

Dependency:

{{< highlight xml "linenos=table" >}}
    <dependency>
        <groupId>com.graphql-java</groupId>
        <artifactId>graphql-java</artifactId>
        <version>9.0</version>
    </dependency>
{{< / highlight >}}


## Hello World

This is the famous "hello world" in ``graphql-java``:

.. literalinclude:: ../src/test/java/HelloWorld.java
    :language: java


## Using the latest development build
----------------------------------

The latest development build is available on Bintray.

Please look at [Latest Build](https://bintray.com/andimarek/graphql-java/graphql-java/_latestVersion>) for the
latest version value.


### How to use the latest build with Gradle

Add the repositories:

{{< highlight groovy "linenos=table" >}}
    repositories {
        mavenCentral()
        maven { url  "http://dl.bintray.com/andimarek/graphql-java" }
    }
{{< / highlight >}}

Dependency:

{{< highlight groovy "linenos=table" >}}
    dependencies {
      compile 'com.graphql-java:graphql-java:INSERT_LATEST_VERSION_HERE'
    }
{{< / highlight >}}



### How to use the latest build with Maven


Add the repository:

{{< highlight xml "linenos=table" >}}
    <repository>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
        <id>bintray-andimarek-graphql-java</id>
        <name>bintray</name>
        <url>http://dl.bintray.com/andimarek/graphql-java</url>
    </repository>
{{< / highlight >}}

Dependency:

{{< highlight xml "linenos=table" >}}
    <dependency>
        <groupId>com.graphql-java</groupId>
        <artifactId>graphql-java</artifactId>
        <version>INSERT_LATEST_VERSION_HERE</version>
    </dependency>
{{< / highlight >}}



