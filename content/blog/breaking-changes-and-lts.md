+++
title = "About breaking changes and Long-term support"
author = "Andreas Marek"
tags = []
categories = []
date = 2018-10-20T01:00:00+10:00
+++

We are releasing new major versions of GraphQL Java roughly every 2 months. They are major versions because we break the API in it. We do it regularly and we prioritize clean code including good naming and design very high. Actually higher than API stability.

We do that because we are optimizing for long-term growth: GraphQL Java is 3 1/2 years old and it is just getting started. This means more people will be positively affected from a better experience compared to the ones who need to refactor.

We do it also because of resource constraints: we are an open source private run project with limited time and resources. We can’t afford maintaining a badly designed project in the long-term. Every bad design, every bad naming makes adding features and adopting to new requirements harder, more time consuming and more unlikely. We also want to make external contributions as easy as possible because we can’t do it all ourself.

The last reason is personal and it is about fun. I don’t wanna maintain a badly designed project. I need to have fun if I wanna continue to invest a large amount of private time in GraphQL Java.

Does that mean we just refactor as crazy and break everything all the time? No it doesn’t. We follow some rules about breaking changes: 

- We never take a functionality away. We deprecate things and make it clear that we don’t really support them anymore, but we don’t take them away without a clear alternative.

- We try to favor simple breaking changes the compiler will catch. For example renaming a method is such a simple change.

- We try to document in our release notes every breaking change clearly.

- Even if we prioritize clean design higher than API stability in general we always weigh the benefits of the change vs the cost of adapting to it. There is no hard rule to that, but we always ask: is it worth it?

But  we understand that not every Organization allows for regular updating major versions of GraphQL Java. This is why we started to maintain a Long-term support (LTS) version of GraphQL Java: 9.x. We will continue to back port all bug fixes to 9.x for some time and we will announce when we will switch to a new LTS version. 

It is not clear yet how long this time span will be and it depends also on your feedback. **Please contribute to this [spectrum thread](https://spectrum.chat/thread/196ab67d-2770-4f3f-b1b3-b056ecb3a2e1) and let us know what suits you best.** If you have special needs and you don’t wanna discuss it in public you can also reach us via [contact form](https://www.graphql-java.com/contact/).


Cheers,<br>
Andi