import * as N3 from "n3.ts"

namespace APG {
	export type Schema = Label[]

	export type Label = Readonly<{ type: "label"; key: string; value: Type }>

	export type Type = Unit | Iri | Literal | Product | Coproduct | Reference
	export type Reference = Readonly<{ type: "reference"; value: number }>
	export type Unit = Readonly<{ type: "unit" }>
	export type Iri = Readonly<{ type: "iri" }>
	export type Literal = Readonly<{ type: "literal"; datatype: string }>
	export type Product = Readonly<{
		type: "product"
		components: readonly Component[]
	}>
	export type Component = Readonly<{
		type: "component"
		key: string
		value: Type
	}>
	export type Coproduct = Readonly<{
		type: "coproduct"
		options: readonly Option[]
	}>
	export type Option = Readonly<{ type: "option"; key: string; value: Type }>

	// export type Path = [number, typeof NaN, ...number[]]

	export type Instance = Value[][]

	export type Value =
		| N3.BlankNode
		| N3.NamedNode
		| N3.Literal
		| Record
		| Variant
		| Pointer

	export class Pointer {
		constructor(readonly index: number) {
			Object.freeze(this)
		}
		public get termType(): "Pointer" {
			return "Pointer"
		}
	}

	export class Record extends Array<Value> {
		constructor(
			readonly node: N3.BlankNode,
			readonly componentKeys: readonly string[],
			values: Iterable<Value>
		) {
			super(...values)
			Object.freeze(this)
		}
		map<T>(f: (value: Value, index: number, record: Record) => T): T[] {
			const result = new Array<T>(this.length)
			for (const [i, value] of this.entries()) {
				result[i] = f(value, i, this)
			}
			return result
		}
		public get termType(): "Record" {
			return "Record"
		}
		public get(key: string): Value {
			const index = this.componentKeys.indexOf(key)
			if (index === -1) {
				throw new Error(`Key not found: ${key}`)
			} else {
				return this[index]
			}
		}
	}

	export class Variant {
		constructor(
			readonly node: N3.BlankNode,
			readonly key: string,
			readonly value: Value
		) {
			Object.freeze(this)
		}
		public get termType(): "Variant" {
			return "Variant"
		}
	}

	export type Expression =
		| Identity
		| Initial
		| Terminal
		| Identifier
		| Constant
		| Dereference
		| Projection
		| Injection
		| Tuple
		| Match

	// Prefix fdjks = jfaksljfdklsa
	// Prefix
	// Expr foo = jkdflsa
	// Expr bar = fjkdsal
	// return
	// unit | <uri> | "": ds:fkjdsl | * | . <jfksld> | / <jkls> (...) | { jfsl -> jals } [fdksla <- fjdksla ; ncmx <- cmn; urieow <- qiopwr]

	export type Identity = Readonly<{ type: "identity" }>
	export type Initial = Readonly<{ type: "initial" }>
	export type Terminal = Readonly<{ type: "terminal" }>
	export type Identifier = Readonly<{ type: "identifier"; value: N3.NamedNode }>
	export type Constant = Readonly<{ type: "constant"; value: N3.Literal }>
	export type Dereference = Readonly<{ type: "dereference"; key: string }>
	export type Projection = Readonly<{ type: "projection"; key: string }>
	export type Injection = Readonly<{
		type: "injection"
		key: string
		value: Expression[]
	}>
	export type Tuple = Readonly<{
		type: "tuple"
		slots: readonly Slot[]
	}>
	export type Slot = Readonly<{
		type: "slot"
		key: string
		value: Expression[]
	}>
	export type Match = Readonly<{
		type: "match"
		cases: readonly Case[]
	}>
	export type Case = Readonly<{
		type: "case"
		key: string
		value: Expression[]
	}>

	export type Map = Readonly<{
		type: "map"
		key: string
		source: string
		target: Path
		value: readonly APG.Expression[]
	}>

	export type Path = readonly {
		readonly type: "component" | "option"
		readonly value: string
	}[]

	export type Mapping = Map[]

	// export type Mapping = readonly [
	// 	readonly APG.Path[],
	// 	readonly (readonly APG.Expression[])[]
	// ]
}

export default APG
