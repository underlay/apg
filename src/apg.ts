import * as N3 from "n3.ts"

type TypeMap = Record<string, APG.Type>
type ExpressionMap = Record<string, APG.Expression[]>

namespace APG {
	export type Schema<T extends TypeMap = TypeMap> = T

	export const schema = <T extends TypeMap>(labels: T): Schema<T> =>
		Object.freeze(labels)

	export type Type = Uri | Literal | Product | Coproduct | Reference

	export interface Reference<T extends string = string> {
		readonly type: "reference"
		readonly value: T
	}

	export const reference = <T extends string>(value: T): Reference<T> =>
		Object.freeze({ type: "reference", value })

	export interface Uri {
		readonly type: "uri"
	}

	export const uri = (): Uri => Object.freeze({ type: "uri" })

	export interface Literal<T extends string = string> {
		readonly type: "literal"
		readonly datatype: T
	}

	export const literal = <T extends string>(datatype: T): Literal<T> =>
		Object.freeze({ type: "literal", datatype })

	export interface Product<T extends TypeMap = TypeMap> {
		readonly type: "product"
		readonly components: Readonly<T>
	}

	export const product = <T extends TypeMap>(components: T): Product<T> =>
		Object.freeze({ type: "product", components: Object.freeze(components) })

	export interface Coproduct<T extends TypeMap = TypeMap> {
		readonly type: "coproduct"
		readonly options: Readonly<T>
	}

	export const coproduct = <T extends TypeMap>(options: T): Coproduct<T> =>
		Object.freeze({ type: "coproduct", options: Object.freeze(options) })

	export type Instance<S extends Schema = Schema> = Readonly<
		{ [key in keyof S]: Value<S[key]>[] }
	>

	export type Value<T extends Type = Type> = T extends Uri
		? N3.NamedNode
		: T extends Literal
		? N3.Literal
		: T extends Product<infer Components>
		? Record<Components>
		: T extends Coproduct<infer Options>
		? Variant<Options>
		: T extends Reference
		? Pointer
		: never

	export class Pointer {
		constructor(readonly index: number) {
			Object.freeze(this)
		}
		public get termType(): "Pointer" {
			return "Pointer"
		}
	}

	export class Record<T extends TypeMap = TypeMap> extends Array<
		Value<T[keyof T]>
	> {
		public get termType(): "Record" {
			return "Record"
		}

		constructor(
			readonly components: readonly (keyof T)[],
			values: Iterable<Value<T[keyof T]>>
		) {
			super(...values)
			Object.freeze(this)
		}

		get<K extends keyof T>(key: K): Value<T[K]> {
			const index = this.components.indexOf(key)
			if (index in this) {
				return this[index] as Value<T[K]>
			} else {
				throw new Error(`Index out of range: ${index}`)
			}
		}

		map<V>(
			f: (value: Value<T[keyof T]>, index: number, record: Record<T>) => V
		): V[] {
			const result = new Array<V>(this.length)
			for (const [i, value] of this.entries()) {
				result[i] = f(value, i, this)
			}
			return result
		}
	}

	const unitKeys: [] = []
	const unitValues: [] = []
	export const unit = () => new Record<{}>(unitKeys, unitValues)

	export class Variant<
		T extends TypeMap = TypeMap,
		K extends keyof T = keyof T
	> {
		readonly index: number
		constructor(
			readonly options: readonly (keyof T)[],
			readonly key: K,
			readonly value: Value<T[K]>
		) {
			this.index = options.indexOf(key)
			if (this.index in options) {
				Object.freeze(this)
			} else {
				throw new Error("Varint index out of range")
			}
		}
		public get termType(): "Variant" {
			return "Variant"
		}
		is<Key extends K>(key: Key): this is Variant<T, Key> {
			return key === this.key
		}
	}

	export type Expression =
		| Identity
		| Identifier
		| Constant
		| Dereference
		| Projection
		| Injection
		| Tuple
		| Match

	export interface Identity {
		readonly type: "identity"
	}

	export const identity = (): Identity => Object.freeze({ type: "identity" })

	export interface Identifier<T extends string = string> {
		readonly type: "identifier"
		readonly value: T
	}

	export const identifier = <Value extends string>(
		value: Value
	): Identifier<Value> => Object.freeze({ type: "identifier", value })

	export interface Constant<
		Datatype extends string = string,
		Value extends string = string
	> {
		readonly type: "constant"
		readonly value: Value
		readonly datatype: Datatype
	}

	export const constant = <
		Datatype extends string = string,
		Value extends string = string
	>(
		value: Value,
		datatype: Datatype
	): Constant<Datatype, Value> =>
		Object.freeze({ type: "constant", value, datatype })

	export interface Dereference<Key extends string = string> {
		readonly type: "dereference"
		readonly key: Key
	}

	export const dereference = <Key extends string = string>(
		key: Key
	): Dereference<Key> => Object.freeze({ type: "dereference", key })

	export interface Projection<Key extends string = string> {
		readonly type: "projection"
		readonly key: Key
	}

	export const projection = <Key extends string = string>(
		key: Key
	): Projection<Key> => Object.freeze({ type: "projection", key })

	export interface Injection<
		Key extends string = string,
		Value extends readonly Expression[] = readonly Expression[]
	> {
		readonly type: "injection"
		readonly key: Key
		readonly value: Value
	}

	export const injection = <
		Key extends string = string,
		Value extends readonly Expression[] = readonly Expression[]
	>(
		key: Key,
		value: Value
	): Injection<Key, Value> => Object.freeze({ type: "injection", key, value })

	export interface Tuple {
		readonly type: "tuple"
		readonly slots: Readonly<ExpressionMap>
	}

	export const tuple = (slots: Readonly<ExpressionMap>): Tuple =>
		Object.freeze({ type: "tuple", slots: Object.freeze(slots) })

	export interface Match {
		readonly type: "match"
		readonly cases: Readonly<ExpressionMap>
	}

	export const match = (cases: Readonly<ExpressionMap>): Match =>
		Object.freeze({ type: "match", cases: Object.freeze(cases) })

	export interface Map {
		readonly type: "map"
		readonly source: string
		readonly value: readonly APG.Expression[]
	}

	export const map = (source: string, value: readonly APG.Expression[]): Map =>
		Object.freeze({ type: "map", source, value })

	export type Mapping = Readonly<{ [key: string]: Map }>

	export const mapping = (maps: Readonly<{ [key: string]: Map }>): Mapping =>
		Object.freeze(maps)
}

export default APG
