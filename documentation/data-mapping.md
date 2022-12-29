---
title: "Data mapping"
date: 2018-09-09T12:52:46+10:00
description: How graphql-java maps object data to graphql types
---
# Mapping output data

## How graphql maps object data to output types

At its heart graphql is all about declaring a type schema and mapping that over backing runtime data.

As the designer of the type schema, it is your challenge to get these elements to meet in the middle.

For example imagine we want to have a graphql type schema as follows:

```graphql
type Query {
  products(match : String) : [Product]   # a list of products
}

type Product {
  id : ID
  name : String
  description : String
  cost : Float
  tax : Float
}
```

We could then run queries over this simple schema via a something like the following:

```graphql
query ProductQuery {
  products(match : "Paper*")
  {
    id, name, cost, tax
  }
}
```

We will have a ``DataFetcher`` on the ``Query.products`` field that is responsible for finding a list of products that match
the argument passed in.

Now imagine we have 3 downstream services.  One that gets product information, one that gets product cost information and one that calculates
product tax information.

graphql-java works by running data fetchers over objects for all that information and mapping that back to the types specified in the schema.

Our challenge is to take these 3 sources of information and present them as one unified type.

We could specify data fetchers on the ``cost`` and ``tax`` fields that does those calculations but this is more to maintain and likely to lead to
`N+1 performance problems`.

We would be better to do all this work in the ``Query.products`` data fetcher and create a unified view of the data at that point.

```java
DataFetcher productsDataFetcher = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment env) {
        String matchArg = env.getArgument("match");

        List<ProductInfo> productInfo = getMatchingProducts(matchArg);

        List<ProductCostInfo> productCostInfo = getProductCosts(productInfo);

        List<ProductTaxInfo> productTaxInfo = getProductTax(productInfo);

        return mapDataTogether(productInfo, productCostInfo, productTaxInfo);
    }
};
```

So looking at the code above we have 3 types of information that need to be combined in a way such that a graphql query above can get access to
the fields ``id, name, cost, tax``

We have two ways to create this mapping.  One is via using a not type safe ``List<Map>`` structure and one by creating a type safe ``List<ProductDTO>`` class that
encapsulates this unified data.

The ``Map`` technique could look like this.

```java
private List<Map> mapDataTogetherViaMap(List<ProductInfo> productInfo, List<ProductCostInfo> productCostInfo, List<ProductTaxInfo> productTaxInfo) {
    List<Map> unifiedView = new ArrayList<>();
    for (int i = 0; i < productInfo.size(); i++) {
        ProductInfo info = productInfo.get(i);
        ProductCostInfo cost = productCostInfo.get(i);
        ProductTaxInfo tax = productTaxInfo.get(i);

        Map<String, Object> objectMap = new HashMap<>();
        objectMap.put("id", info.getId());
        objectMap.put("name", info.getName());
        objectMap.put("description", info.getDescription());
        objectMap.put("cost", cost.getCost());
        objectMap.put("tax", tax.getTax());

        unifiedView.add(objectMap);
    }
    return unifiedView;
}
```

The more type safe ``DTO`` technique could look like this.

```java
class ProductDTO {
    private final String id;
    private final String name;
    private final String description;
    private final Float cost;
    private final Float tax;

    public ProductDTO(String id, String name, String description, Float cost, Float tax) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.cost = cost;
        this.tax = tax;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Float getCost() {
        return cost;
    }

    public Float getTax() {
        return tax;
    }
}

private List<ProductDTO> mapDataTogetherViaDTO(List<ProductInfo> productInfo, List<ProductCostInfo> productCostInfo, List<ProductTaxInfo> productTaxInfo) {
    List<ProductDTO> unifiedView = new ArrayList<>();
    for (int i = 0; i < productInfo.size(); i++) {
        ProductInfo info = productInfo.get(i);
        ProductCostInfo cost = productCostInfo.get(i);
        ProductTaxInfo tax = productTaxInfo.get(i);

        ProductDTO productDTO = new ProductDTO(
                info.getId(),
                info.getName(),
                info.getDescription(),
                cost.getCost(),
                tax.getTax()
        );
        unifiedView.add(productDTO);
    }
    return unifiedView;
}
```

The graphql engine will now use that list of objects and run the query sub fields ``id, name, cost, tax`` over it.

The default data fetcher in graphql-java is ``graphql.schema.PropertyDataFetcher`` which has both map support and POJO support.

For every object in the list it will look for an ``id`` field, find it by name in a map or via a `getId()` getter method and that will be sent back in the graphql
response.  It does that for every field in the query on that type.

By creating a "unified view" at the higher level data fetcher, you have mapped between your runtime view of the data and the graphql schema view of the data.

# Mapping input data

## How graphql maps object data to input types

Input type values are provided to as input to a graphql operation.  The three kinds of types that can be input are **Enums**, **Scalars** and **Input Object Types** and the **List** and **Non-Null** variants of these
type kinds.

The following outlines how graphql-java represents these type kinds in JVM runtime terms.

### Enums

graphql-java maps input `Enum` values by name.  When you create the `graphql.schema.GraphQLEnumType` instance you can in theory map a name `java.lang.String`
to any JVM object.  But this is not common at all.  Mostly the name of the enum value is the actual value of it.

```graphql
enum RGB {
    RED, BLUE, GREEN
}

scalar Pantone

type Query {
    toPantone( color : RGB) : Pantone
}
```

The `RGB` enum type above has the runtime JVM `java.lang.String` values of `"RED"`,`"BLUE"` and `"GREEN"` on input and output.

The graphql-java system allow you to also input `java.lang.Enum` but this is not common at all for input.  The reason it's not common is that this would 
require you to turn your network input into Java enums and this is not a common action of serialisation frameworks.

If the input value to the enum comes from the graphql operation document, then the input value will initially be a `graphql.language.EnumValue` which
is the AST representation of a graphql `Enum` value.  This will be converted by graphql-java to a value by name.  

So a query document like the following will end up mapping the AST enum input value `RED` to the JVM value `"RED"`.

```graphql
query MyColors {
    toPantone(color : RED)
}
```

### Scalars

The input values to a scalar are controlled by the scalar implementation.  If their `graphql.schema.Coercing#parseValue(java.lang.Object, graphql.GraphQLContext, java.util.Locale)` accepts
a certain value then it's up to them to decide what JVM object is returned by the scalar code.

The graphql-java scalars will return the following values as JVM object input values.

* **String** aka ``GraphQLString`` - will produce a `java.lang.String`
* **Boolean** aka ``GraphQLBoolean`` - will produce a `java.lang.Boolean`
* **Int** aka ``GraphQLInt`` - will produce a `java.lang.Integer`
* **Float** aka ``GraphQLFloat`` - will produce a `java.lang.Double`
* **ID** aka ``GraphQLID`` - will produce a `java.lang.String`

### Input Object Types

Input object types are complex input types with named input fields. The runtime JVM representation will be a `java.util.Map`.  Specifically 
a map that ordered its keys in a predictable way.

So imagine this input type named `Person`

```graphql
input Person {
    name : String!
    age : Int!
}

type Query {
    contact(person : Person) : String
}
```

This will be represented at runtime as a `java.util.Map` containing a key `name` with a `java.lang.String` value and 
a key `age` with a `java.lang.Integer` value.

### Nonnull input types

There is no special runtime object used for non-null input types other than the called code can safely assume that the object
is not a null value.

```graphql
type Query {
    field(arg1 : String!, arg2 : String) : String
}
```

So in the example above the `arg1` field argument will always be a non-null `java.lang.String` value while `arg2` may be `null` at runtime.

### Lists of input types

If the input type is a graphql list input type then the runtime JVM representation will be a `java.util.List` of the wrapped input type.

So as an example, given

```graphql
type Query {
    field(arg : [String!]!) : String
}
```

The `arg` field argument would be a non-null `java.util.List` containing zero or more non-null `java.lang.String` values.

In graphql you can say that a list is non-null and its entries are also non-null
however there is no way to say that the list has one or more entries.  

The `arg` field argument above could be an empty list.  It will not be `null` but it could be empty.

Complex runtime input values can be declared and the runtime representation will reflect that.

```graphql
input Person {
    name : String!
    age : Int!
    friends : [Person!]
}

type Query {
    contacts(people : [Person!]!) : String
}

```

The `person` field argument would be a `java.util.List` containing one or more `java.util.Map`s, where each map contained named entries 
and the `friends` map entry could itself be a `java.util.List` containing one or more `java.util.Map`s, so imagine 
the following representation at runtime :

```java
        List.of(
                Map.of("name", "Brad",
                        "age", 42,
                        "friends", List.of(
                                Map.of("name", "Bill",
                                        "age", 17,
                                        "friends", List.of()
                                )
                        )
                ),
                Map.of("name", "Andreas",
                        "age", 34,
                        "friends", List.of(
                                Map.of("name", "Ted",
                                        "age", 15,
                                        "friends", List.of()
                                )
                        )
                )
        );

```