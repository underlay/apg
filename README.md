# apg

> TypeScript APG utilities

The `APG` namespace holds the type definitions for the schema terms:

```typescript
export namespace APG {
	export type Schema = Label[]

	export type Label = {
		id: string
		type: "label"
		key: string
		value: Type
	}

	export type Type = Reference | Unit | Iri | Literal | Product | Coproduct

	type Pattern = {} | { pattern: string; flags: string }
	export type Reference = { id: string }
	export type Unit = { type: "unit" }
	export type Iri = { type: "iri" } & Pattern
	export type Literal = { type: "literal"; datatype: string } & Pattern
	export type Product = { type: "product"; components: Component[] }
	export type Component = { type: "component"; key: string; value: Type }
	export type Coproduct = { type: "coproduct"; options: Option[] }
	export type Option = { type: "option"; value: Type }
}
```

The main utilities are:

```typescript
import * as N3 from "n3.ts"
import { FailureResult } from "@shexjs/validator"

declare class Tree {
    readonly node: N3.BlankNode;
    private readonly children;
    constructor(node: N3.BlankNode, children: Iterable<[string, Value]>);
    get termType(): string;
    get value(): string;
    get size(): number;
    [Symbol.iterator](): IterableIterator<[string, Value]>;
    get(node: string): N3.Literal | N3.BlankNode | Tree | N3.NamedNode<string> | undefined;
}

type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Tree

function parseSchemaString(
  input: string,
  schemaSchema: APG.Schema
): Either<FailureResult, APG.Schema> {}

function parseSchema(
  store: Store,
  schemaSchema: APG.Schema
): Either<FailureResult, APG.Schema> {}

function parse(
  store: Store,
  schema: APG.Schema
): Generator<[APG.Label, Generator<[Subject<D>, Either<FailureResult, Value>]>], void, undefined> {}
```
