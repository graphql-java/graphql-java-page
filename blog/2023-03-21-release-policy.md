---
title: "GraphQL Java release policy"
authors: donna
slug: release-policy
---

We’re formalising our release schedule to give the community a better idea of when to expect releases, what will be contained within them, and when important fixes will be backported.

## General release schedule
Going forward, we plan to have 4 releases every year, approximately one per quarter. We will alternate between releases containing breaking changes, and releases containing features and bugfixes (without breaking changes).

For example: our next release 20.1 will be in late March 2023, and this will be a feature and bugfix release without breaking changes. Therefore, we’re going to retain Java 8 in the 20.1 release. Our subsequent quarterly release will be around early July 2023 and will contain breaking changes, including upgrading to Java 11.

## Security backports
We will backport critical bugfixes and security fixes for versions dating back 18 months (or roughly 6 versions). These fixes will be backported depending on severity and demand. As security fixes are time sensitive, we will release them on demand instead of waiting for the next quarterly release date.

## Bugfix backports
We will backport important bug fixes at most 12 months (or roughly 4 versions). These fixes will be backported depending on the severity of the bug and demand.

## Deprecations
When code is deprecated, we will wait at least 12 months before removing it (or roughly 4 versions).

## Version numbering
We will continue to use `major.minor` version numbering.

A minor version can include bug fixes and features, but not breaking changes. A major version can include breaking changes.

## Allowing for policy changes
The aim of this release policy to give the community a better indication of release dates, what is contained in releases, and when fixes will be backported. However, we may make a pragmatic decision to diverge from this policy when required. For example, a major and urgent breaking change could result in two breaking change releases in a row. If we diverge from this release policy, we’ll make it clear in the release notes.
