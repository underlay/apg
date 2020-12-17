# apg

> Algebraic Property Graphs

This is an implementation of an _algebraic data model_, generally adapted from [this paper](https://arxiv.org/abs/1909.04881). This repo has type definitions for schemas, values, and mappings (schema-to-schema transformations) for the data model, along with functions for creating, manipulating, type-checking, and applying them.

Schemas are _self-hosting_, which means that schemas themselves are serialized as instances of a "schema schema".

## Table of Contents

- [Overview](#overview)
- [Structures](#structures)
  - [Schemas, labels, and types](#schemas-labels-and-types)
  - [Instances and values](#instances-and-values)
- [API](#api)

## Overview

The birds-eye view is that this library defines a collection of structures that you can use to model, serialize, and parse data - similar to JSON or Protobuf. The reason you'd want to do this is that _this_ data model in particular is a little bit magical: it's unusually good at representing most other data models, and it also gives us a little grammar of schema _mappings_ that we can use transform, migrate, and integrate data more reliably than we could if we were just writing code.

## Terms

| Type        | Value       | Expression             |
| ----------- | ----------- | ---------------------- |
| `reference` | `Pointer`   | `dereference`          |
| `uri`       | `NamedNode` | `identifier`           |
| `literal`   | `Literal`   | `constant`             |
| `product`   | `Record`    | `tuple` / `projection` |
| `coproduct` | `Variant`   | `injection` /`match`   |

## Structures

There are three basic kinds of structures defined in [src/apg.ts](src/apg.ts): _labels_, which are terms in a grammar of _types_, _schemas_, which are collections of _labels_; _instances_, which are collections of _values_.

### Schemas, labels, and types

A schema is a set of _labels_, each of which has an associated _type_:

![](images/schema.svg)

Here, the grey rectangles are labels, and the white ellipses are types. The broad intuition is that types can be these complex things composed of other types, and that labels are like "handles" or variables that some of those types are assigned to.

There are a few different kinds of types. Primitive (or "scalar") types are are types like "number" or "string". Then there are two kinds of _composite_ types, which are made up of other types. And lastly there are _reference_ types that point back up to one of the labels.

| Type      |   Kind    |                       Interpretation |
| --------- | :-------: | -----------------------------------: |
| reference | reference |            label, pointer, recursion |
| uri       | primitive | RDF Named Nodes, "identifier", "key" |
| literal   | primitive |                RDF Literals, "value" |
| product   | composite |         tuple, record, struct, "AND" |
| coproduct | composite |            sum, variant, union, "OR" |

Literal types are "configured" with a fixed datatype. In other words, there's no generic "RDF literal" type - literal types are always "RDF literals with datatype \${some IRI}". Similarly, products and coproducts are "configured" to be over a fixed, finite set of other types, and references are configured to point to a fixed label in the same schema.

Except for references, there can't be any cycles in the "type tree" - for example, a product can't have itself as a child component. In this sense, labels can work like explicit "re-entry points" for recursive schemas.

So how does this all represented?

A schema is a map from URI keys to `Type` values:

```typescript
type Schema = { [key: string]: Type }
```

There are five kinds of types:

```typescript
type Type = Reference | Uri | Literal | Product | Coproduct

type Reference = { type: "reference"; value: string }
type Uri = { type: "uri" }
type Literal = { type: "literal"; datatype: string }
type Product = { type: "product"; components: { [key: string]: Type } }
type Coproduct = { type: "coproduct"; options: { [key: string]: Type } }
```

The "parts" of a product type are called _components_, and the parts of a coproduct type are called _options_.

### Instances and values

So we've seen how schemas and types are represented - what do _values of those types_ look like?

```typescript
type Value =
	| N3.NamedNode // Uri value
	| N3.Literal // Literal value
	| Record // Product value
	| Variant // Coproduct value
	| Pointer // Reference value
```

The primitives are easy: URI types have named nodes as values, and literal types have literals as values.

The composite types are simple classes

```typescript
class Record extends Array<Value> {
	constructor(readonly components: readonly string[], values: Iterable<Value>) {
		super(values)
	}
	get termType() {
		return "Record"
	}
}

class Variant {
	constructor(
		readonly options: string[],
		readonly option: string,
		readonly value: Value
	) {}
	get termType() {
		return "Variant"
	}
}

class Pointer {
	constructor(readonly index: number)
	get termType() {
		return "Pointer"
	}
}
```
