---
title: "Contributions"
date: 2018-09-09T12:52:46+10:00
description: Every contribution to make this project better is welcome. Thank you!
---
# Contributions

Every contribution to make this project better is welcome: Thank you!

In order to make this as pleasant as possible for everybody involved, here are some tips:

* Respect the [Code of Conduct](https://github.com/graphql-java/graphql-java/blob/master/CODE_OF_CONDUCT.md)

* Before opening an Issue to report a bug, please try the latest development version. It can happen that the problem has been already solved.

* Please use Markdown to format your comments properly. If you are not familiar with that: [Getting started with writing and formatting on GitHub](https://help.github.com/articles/getting-started-with-writing-and-formatting-on-github)

* For Pull Requests:
  * Here are some [general tips](https://github.com/blog/1943-how-to-write-the-perfect-pull-request)

  * Please be as focused and clear as possible and don't mix concerns. This includes refactorings mixed with bug-fixes/features, see [Open Source Contribution Etiquette](http://tirania.org/blog/archive/2010/Dec-31.html).

  * It would be good to add automatic tests. All tests are written in [Spock](http://spockframework.github.io/spock/docs/1.0/index.html).

## Build and test locally

Clone the repo and type

```bash
./gradlew build
```

In `build/libs` you will find the jar file.

Running the tests:

```bash
./gradlew test
```

Installing in the local Maven repository:

```bash
./gradlew install
```
