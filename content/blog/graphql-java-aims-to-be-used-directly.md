+++
title = "GraphQL Java aims to be used directly"
author = "Andreas Marek"
tags = []
categories = []
date = 2018-11-10T01:00:00+10:00
+++

There seems to be a common misconception about GraphQL Java: that you should not use it directly, 
but rather use another library build on top of it.

We think it is important to make it clear, that this is not the case: GraphQL Java aims to be a library used directly 
without any additionally abstraction on top. It was always build with this goal in mind.

To be fair: we didn't do a very good job so far to make that clear. For example up 
[until recently](https://www.graphql-java.com/blog/moving-projects/) we hosted several other projects which 
provided abstractions on top of GraphQL Java. This was because of historical reasons and we didn't give any 
guidance on when to use what. There are also currently more tutorials out there which don't use GraphQL Java directly
compared to tutorials which do.

The other reason people might think that GraphQL Java is not suitable is because the [core project](https://github.com/graphql-java/graphql-java) 
doesn't provide any easy way to get a full service with HTTP endpoint up and running. 
And the existing third party projects providing for example Spring Boot support 
are adding abstractions.

The core project doesn't deal with any form of HTTP or JSON specific things and has on purpose basically no 
dependencies at all. This will not change, but we recognize the need for having an easy way to get a 
full service up and running. This is why we are currently working on first class Spring (Boot) support.  

This is not done yet, but it will provide an easy way to integrate GraphQL Java in a Spring (Boot) application 
without adding any abstraction on top of GraphQL Java. It will also be extended over time with more advanced features 
like Apollo Defer support. 


To recap:

1. GraphQL Java aims to be a first class library used directly
1. The [GraphQL Java core project](https://github.com/graphql-java/graphql-java) doesn't deal with HTTP/JSON and will continue not do it
1. The [GraphQL Java Spring project](https://github.com/graphql-java/graphql-java-spring) will complement 
the core project in providing comprehensive Spring (Boot) support

Cheers,<br>
Andi


