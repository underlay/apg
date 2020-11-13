import * as N3 from "n3.ts"

namespace APG {
	export type Schema = Label[]

	export type Label = Readonly<{ type: "label"; key: string; value: Type }>

	export type Type = Unit | Iri | Literal | Product | Coproduct | Reference
	export type Reference = Readonly<{ type: "reference"; value: number }>
	export type Unit = Readonly<{ type: "unit" }>
	export type Iri = Readonly<{ type: "iri" }>
	export type Literal = Readonly<{ type: "literal"; datatype: string }>
	export type Product = Readonly<{ type: "product"; components: Component[] }>
	export type Component = Readonly<{
		type: "component"
		key: string
		value: Type
	}>
	export type Coproduct = Readonly<{ type: "coproduct"; options: Option[] }>
	export type Option = Readonly<{ type: "option"; key: string; value: Type }>

	export type Path = [number, typeof NaN, ...number[]]

	export type Instance = Value[][]

	export type Value =
		| N3.BlankNode
		| N3.NamedNode
		| N3.Literal
		| Record
		| Variant
		| Pointer

	export class Pointer {
		constructor(readonly index: number, readonly label: number) {
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
				throw new Error("Key not found")
			} else {
				return this[index]
			}
		}
	}

	export class Variant {
		constructor(
			readonly node: N3.BlankNode,
			readonly optionKeys: readonly string[],
			readonly index: number,
			readonly value: Value
		) {
			Object.freeze(this)
		}
		public get termType(): "Variant" {
			return "Variant"
		}
		public get key(): string {
			return this.optionKeys[this.index]
		}
	}

	export type Morphism =
		| Identity
		| Dereference
		| Composition
		| Projection
		| Injection
		| Tuple
		| Case
		| Constant
		| Terminal
		| Initial

	export type Identity = Readonly<{ type: "identity" }>
	export type Dereference = Readonly<{ type: "dereference" }>
	export type Composition = Readonly<{
		type: "composition"
		object: APG.Type
		morphisms: [Morphism, Morphism]
	}>
	export type Projection = Readonly<{
		type: "projection"
		index: number
		componentKeys: readonly string[]
	}>
	export type Injection = Readonly<{
		type: "injection"
		index: number
		optionKeys: readonly string[]
	}>
	export type Tuple = Readonly<{
		type: "tuple"
		morphisms: Morphism[]
		componentKeys: readonly string[]
	}>
	export type Case = Readonly<{
		type: "case"
		morphisms: Morphism[]
		optionKeys: readonly string[]
	}>
	export type Terminal = Readonly<{ type: "terminal" }>
	export type Initial = Readonly<{ type: "initial" }>
	export type Constant = Readonly<{
		type: "constant"
		value: N3.NamedNode | N3.Literal
	}>
}

export default APG
