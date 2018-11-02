Install Hugo
=============

    brew install hugo

Run locally
===========

    hugo server -w


Our short codes
==============

This is an example of using the `examplecode` shortcode to extract example text from external URLs.  The forexample service is used under the covers

    {{< highlight java "linenos=table" >}}
    {{< examplecode url="https://raw.githubusercontent.com/graphql-java/graphql-java/master/src/test/groovy/readme/DataLoaderBatchingExamples.java" figure="FigureA" lines="1-19" >}}
    {{< /highlight >}}
