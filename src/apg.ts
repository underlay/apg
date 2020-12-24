import * as N3 from "n3.ts"
import { forEntries } from "./utils.js"

export type Schema<
	S extends { [key in string]: Type } = { [key in string]: Type }
> = Readonly<S>

export const schema = <S extends { [key in string]: Type }>(
	labels: S
): Schema<S> => Object.freeze(labels)

export type Type = Uri | Literal | Product | Coproduct | Reference

export interface Reference<T extends string = string> {
	readonly type: "reference"
	readonly value: T
}

export const reference = <T extends string>(value: T): Reference<T> =>
	Object.freeze({ type: "reference", value })

export const isReference = (type: Type): type is Reference =>
	type.type === "reference"

export interface Uri {
	readonly type: "uri"
}

export const uri = (): Uri => Object.freeze({ type: "uri" })

export const isUri = (type: Type): type is Uri => type.type === "uri"

export interface Literal<T extends string = string> {
	readonly type: "literal"
	readonly datatype: T
}

export const literal = <T extends string>(datatype: T): Literal<T> =>
	Object.freeze({ type: "literal", datatype })

export const isLiteral = (type: Type): type is Literal =>
	type.type === "literal"

export interface Product<
	Components extends { [key in string]: Type } = {
		[key in string]: Type
	}
> {
	readonly type: "product"
	readonly components: Readonly<Components>
}

export const product = <
	Components extends { [key in string]: Type } = {
		[key in string]: Type
	}
>(
	components: Components
): Product<Components> =>
	Object.freeze({ type: "product", components: Object.freeze(components) })

export const isProduct = (type: Type): type is Product =>
	type.type === "product"

export interface Coproduct<
	Options extends { [key in string]: Type } = {
		[key in string]: Type
	}
> {
	readonly type: "coproduct"
	readonly options: Readonly<Options>
}

export const coproduct = <
	Options extends { [key in string]: Type } = {
		[key in string]: Type
	}
>(
	options: Options
): Coproduct<Options> =>
	Object.freeze({ type: "coproduct", options: Object.freeze(options) })

export const isCoproduct = (type: Type): type is Coproduct =>
	type.type === "coproduct"

export type Instance<
	S extends { [key in string]: Type } = { [key in string]: Type }
> = Readonly<{ [key in keyof S]: Value<S[key]>[] }>

export const instance = <S extends { [key in string]: Type }>(
	schema: S,
	instance: { [key in keyof S]: Value<S[key]>[] }
): Instance<S> => {
	for (const [{}, values] of forEntries(instance)) {
		Object.freeze(values)
	}
	return Object.freeze(instance)
}

export type Value<T extends Type = Type> = T extends Uri
	? N3.NamedNode
	: T extends Literal<infer D>
	? N3.Literal<D>
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

export const isPointer = (value: Value): value is Pointer =>
	value.termType === "Pointer"

export const isNamedNode = (value: Value): value is N3.NamedNode =>
	value.termType === "NamedNode"

export const isLiteralValue = (value: Value): value is N3.Literal =>
	value.termType === "Literal"

export class Record<
	Components extends { [key in string]: Type } = {
		[key in string]: Type
	}
> extends Array<Value<Components[keyof Components]>> {
	public get termType(): "Record" {
		return "Record"
	}

	constructor(
		readonly components: readonly (keyof Components)[],
		values: Iterable<Value<Components[keyof Components]>>
	) {
		super(...values)
		Object.freeze(this)
	}

	get<K extends keyof Components>(key: K): Value<Components[K]> {
		const index = this.components.indexOf(key)
		if (index in this) {
			return this[index] as Value<Components[K]>
		} else {
			throw new Error(`Index out of range: ${index}`)
		}
	}

	map<V>(
		f: (
			value: Value<Components[keyof Components]>,
			index: number,
			record: Record<Components>
		) => V
	): V[] {
		const result = new Array<V>(this.length)
		for (const [i, value] of this.entries()) {
			result[i] = f(value, i, this)
		}
		return result
	}
}

export const isRecord = (value: Value): value is Record =>
	value.termType === "Record"

const unitKeys: [] = []
const unitValues: [] = []
export const unit = () => new Record<{}>(unitKeys, unitValues)

export class Variant<
	Options extends { [key in string]: Type } = {
		[key in string]: Type
	},
	Option extends keyof Options = keyof Options
> {
	readonly index: number
	constructor(
		readonly options: readonly (keyof Options)[],
		readonly key: Option,
		readonly value: Value<Options[Option]>
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
	is<Key extends keyof Options>(key: Key): this is Variant<Options, Key> {
		return (key as string) === (this.key as string)
	}
}

export const isVariant = (value: Value): value is Variant =>
	value.termType === "Variant"

export type Expression =
	| Identifier
	| Constant
	| Dereference
	| Projection
	| Injection
	| Tuple
	| Match

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
	Key extends string = string
	// Value extends readonly Expression[] = readonly Expression[]
> {
	readonly type: "injection"
	readonly key: Key
	// readonly value: Value
}

export const injection = <
	Key extends string = string
	// Value extends readonly Expression[] = readonly Expression[]
>(
	key: Key
	// value: Value
	// ): Injection<Key, Value> => Object.freeze({ type: "injection", key, value })
): Injection<Key> => Object.freeze({ type: "injection", key })

export interface Tuple {
	readonly type: "tuple"
	readonly slots: Readonly<{ [key in string]: Expression[] }>
}

export const tuple = (
	slots: Readonly<{ [key in string]: Expression[] }>
): Tuple => Object.freeze({ type: "tuple", slots: Object.freeze(slots) })

export interface Match {
	readonly type: "match"
	readonly cases: Readonly<{ [key in string]: Expression[] }>
}

export const match = (
	cases: Readonly<{ [key in string]: Expression[] }>
): Match => Object.freeze({ type: "match", cases: Object.freeze(cases) })

export interface Map {
	readonly type: "map"
	readonly source: string
	readonly value: readonly Expression[]
}

export const map = (source: string, value: readonly Expression[]): Map =>
	Object.freeze({ type: "map", source, value })

export type Mapping = Readonly<{ [key: string]: Map }>

export const mapping = (maps: Readonly<{ [key: string]: Map }>): Mapping =>
	Object.freeze(maps)
