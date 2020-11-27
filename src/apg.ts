import * as N3 from "n3.ts"

namespace APG {
	export type Schema = Readonly<{ [key: string]: Type }>

	export type Type = Unit | Uri | Literal | Product | Coproduct | Reference
	export type Reference = Readonly<{ type: "reference"; value: string }>
	export type Unit = Readonly<{ type: "unit" }>
	export type Uri = Readonly<{ type: "uri" }>
	export type Literal = Readonly<{ type: "literal"; datatype: string }>
	export type Product = Readonly<{
		type: "product"
		components: Readonly<{ [key: string]: Type }>
	}>
	export type Coproduct = Readonly<{
		type: "coproduct"
		options: Readonly<{ [key: string]: Type }>
	}>

	export type Instance = Readonly<{ [key: string]: Value[] }>

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
		public get termType(): "Record" {
			return "Record"
		}

		constructor(
			readonly components: readonly string[],
			values: Iterable<Value>
		) {
			super(...values)
			Object.freeze(this)
		}

		get(key: string): Value {
			const index = this.components.indexOf(key)
			if (index in this) {
				return this[index]
			} else {
				throw new Error(`Index out of range: ${index}`)
			}
		}

		map<T>(f: (value: Value, index: number, record: Record) => T): T[] {
			const result = new Array<T>(this.length)
			for (const [i, value] of this.entries()) {
				result[i] = f(value, i, this)
			}
			return result
		}
	}

	export class Variant {
		constructor(readonly option: string, readonly value: Value) {
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

	export type Identity = Readonly<{ type: "identity" }>
	export type Initial = Readonly<{ type: "initial" }>
	export type Terminal = Readonly<{ type: "terminal" }>
	export type Identifier = Readonly<{ type: "identifier"; value: string }>
	export type Constant = Readonly<{
		type: "constant"
		value: string
		datatype: string
	}>
	export type Dereference = Readonly<{ type: "dereference"; key: string }>
	export type Projection = Readonly<{ type: "projection"; key: string }>
	export type Injection = Readonly<{
		type: "injection"
		key: string
		value: Expression[]
	}>
	export type Tuple = Readonly<{
		type: "tuple"
		slots: Readonly<{ [key: string]: Expression[] }>
	}>
	export type Match = Readonly<{
		type: "match"
		cases: Readonly<{ [key: string]: Expression[] }>
	}>

	export type Map = Readonly<{
		type: "map"
		source: string
		target: Path
		value: readonly APG.Expression[]
	}>

	export type Path = readonly {
		readonly type: "component" | "option"
		readonly key: string
	}[]

	export type Mapping = Readonly<{ [key: string]: Map }>
}

export default APG
