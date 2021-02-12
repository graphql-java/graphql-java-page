---
title: "GraphQL spec releases are not important"
date: 2021-02-12T09:00:00+10:00
author: Andreas Marek
draft: false
---

Every once in a while somebody asks which version of the GraphQL spec GraphQL Java supports.
The general answer is: the current draft.

The bigger question behind this is: what is the information you want get out of this question? 
Why do you ask this question?

The thing is: spec releases are not really important and people misinterpret what they mean.

# Evolution of the spec process

The GraphQL spec has five releases so far: 

- two in 2015 (including the first published version)
- two in 2016
- one in 2018

As you can see in the first two years spec releases where quite frequently, but after the one in 2018,
there has not been a release.

2017 was also the year the [GraphQL Working Group](https://github.com/graphql/graphql-wg) was established.
This group is the main forum to evolve the spec since then. Over time this group established a very high bar 
for every PR to be merged into the spec. (See the [Contributing guidelines](https://github.com/graphql/graphql-spec/blob/main/CONTRIBUTING.md)) 

With this high standard set, nearly all implementations (including GraphQL Java) started to implement every 
merged PR instead of waiting for a big release. Because they are very confident this change will be released
in this form, it is safe to implement it right away.

This treatment of merged PRs as de-factor releases is now an established rule in the GraphQL community. 
This explains why the whole GraphQL ecosystem has evolved a lot since 2018, even without a release.  

__A release is not needed anymore if every merged PR is like a mini release.__
 
Future releases are more like an 
[opportunity to look back and promote the work since the last release.](https://github.com/graphql/graphql-wg/blob/main/notes/2021-02-04.md#promoting-and-documenting-spec-release-5m-brian)

I personally hope that we make this de-facto rule, that evey PR is a mini release, more official. 
We should not use the word "draft" any more, but every merged PR should automatically result in a 
new GraphQL spec version which is formally approved by the [GraphQL TSC.](https://github.com/graphql/graphql-wg/blob/main/GraphQL-TSC.md)

Coming back to the question: "Which spec version of GraphQL is supported"? 
I hope by now it is clear why this question is probably not really helpful. 

It is better to think about certain features you want to discuss instead referring to the spec releases.   

# Feedback or questions
We use [GitHub Discussions](https://github.com/graphql-java/graphql-java/discussions) for general feedback and questions.

You can also contact us on Twitter: [@graphql_java](https://twitter.com/graphql_java)

You can also checkout our [Workshops](/workshops) for more possibilities to learn about GraphQL 
and GraphQL Java.



