# apg

> TypeScript APG utilities

This is an implementation of an algebraic data model over RDF, generally adapted from [this paper](https://arxiv.org/abs/1909.04881).

Schemas are _self-hosting_, which means that schemas themselves are serialized as RDF datasets and parsed using a [schema schema](schema.schema.json).

The RDF representation is very verbose, even by RDF standards, so we usually use [graphical tools](https://underlay.github.io/playground/schema-editor/index.html) to view, compose, and edit them.

## Overview

The birds-eye view is that this library defines a collection of structures that you can use to model, serialize, and parse data - kind of like JSON or Protobuf. The reason you'd want to do this is that _this_ data model in particular is a little bit magical: it's unusually good at representing most other data models, and it also gives us a little grammar of schema _mappings_ that we can use transform, migrate, and integrate data more reliably than we could if we were just writing code.

## Structures

There are three basic kinds of structures defined in [src/apg.ts](src/apg.ts): _schemas_, which are collections of _labels_ and _types_; _instances_, which are collections of _values_; and _schema mappings_, which map one schema onto another.

### Schemas, labels, and types

A schema is a set of _labels_, each of which has an associated _type_:

![](images/schema.svg)

Here, the grey rectangles are labels, and the white ellipses are types. The broad intuition is that types can be these complex things composed of other types, and that labels are like "handles" or variables that some of those types are assigned to.

There are a few different kinds of types. Primitive (or "scalar") types are are types like "number" or "string". Then there are two kinds of _composite_ types, which are made up of other types. And lastly there are _reference_ types that point back up to one of the labels.

| Type      |   Kind    |                       Interpretation |
| --------- | :-------: | -----------------------------------: |
| unit      | primitive |      RDF Blank Nodes, "node", "null" |
| iri       | primitive | RDF Named Nodes, "identifier", "key" |
| literal   | primitive |                RDF Literals, "value" |
| product   | composite |         tuple, record, struct, "AND" |
| coproduct | composite |            sum, variant, union, "OR" |
| reference | reference |                     label, recursion |

Literal types are "configured" with a fixed datatype. In other words, there's no generic "RDF literal" type - literal types are always "RDF literals with datatype \${some IRI}". Similarly, products and coproducts are "configured" to be over a fixed, finite set of other types, and references are configured to point to a fixed label in the same schema.

Except for references, there can't be any cycles in the "type tree" - for example, a product can't have itself as a child component. In this sense, labels are like explicit "re-entry points" for recursive schemas.

So how does this all represented?

In a schema, every label and type (even nested, "child" types) has a string identifier that is used as the key of an ES6 `Map`:

```typescript
type Schema = {
	labels: Map<string, Label>
	types: Map<string, Type>
}
```

When a schema is parsed from an RDF dataset, these keys will be blank node labels (_without_ `_:` prefixes).

```typescript
type Reference = {
	type: "reference"
	value: string
}

type Label = {
	type: "label"
	key: string
	value: string | Reference
}
```

`Reference` is a kind of type, but it gets special treatment in the TypeScript representation. All of the other types are indexed by a string key in the `Schema.types` map, but references get "inlined" - they're not included in the map, and every place where types (_schema_ types) get used actually use a `string | Reference` type (_TypeScript_ type) instead. If it's a string, it means that string a key of `Schema.types`; if it's a `Reference` object, then `Reference.value` is a key of `Schema.labels`.

Labels have a URI key `Label.key` and a value `Label.value` that is either a `Schema.types` key or a reference to another label. The keys of the `Schema.labels` map are _not_ the `Label.key` URI - instead, like `Schema.types`, the keys of `Schema.labels` are blank node labels from the dataset that the schema was parsed from. This is confusing at first, but having the two different kinds of identifiers for labels turns out to be useful in the long run.

The rest of the types follow the same overall pattern:

```typescript
type Type = Unit | Iri | Literal | Product | Coproduct

type Unit = { type: "unit" }
type Iri = { type: "iri" }
type Literal = { type: "literal"; datatype: string }
type Product = { type: "product"; components: Map<string, Component> }
type Component = { type: "component"; key: string; value: string | Reference }
type Coproduct = { type: "coproduct"; options: Map<string, Option> }
type Option = { type: "option"; key: string; value: string | Reference }
```

The "parts" of a product type are called _components_, and the parts of a coproduct type are called _options_. Both components and options have a URI key `Component.key` / `Option.key` and a value `Component.value` / `Option.value` that is either a `Schema.types` key or a label reference. Components and options are also both indexed by string keys in a map. The keys of this `Product.components` / `Coproduct.options` map are _not_ the URI keys of the components or options - they're actually also blank node labels from the dataset that the schema was parsed from. Again, this is confusing at first, but having the two different kinds of identifiers for components and options turns out to be useful in the long run.

### Instances and values

So we've seen how schemas and types are represented - what do _values of those types_ look like?

```typescript
type Value =
	| N3.BlankNode
	| N3.NamedNode
	| N3.Literal
	| ProductValue
	| CoproductValue
```

The primitives are easy: unit types have blank nodes as values, IRI types have named nodes as values, and literal types have literals as values.

What about the composite types?

```typescript
type ProductValue = {
	termType: "Product"
	node: N3.BlankNode
	children: Map<string, Value>
}
```

For products we create our own class with its own `ProductValue.termType: "Product"` so that we can easily discrimitate instances from values of other types. Products are liek tuples or structs, so a product value is just a map with an entry for each component.

The keys of the `ProductValue.children` map are the same as the keys of its type's `Product.component` map - they're blank node labels, not URI keys.

How about coproducts? Coproduct values, on the other hand, have a value for just one of their options.

```typescript
type CoproductValue = {
	termType: "Coproduct"
	node: N3.BlankNode
	option: string
	value: Value
}
```
