import * as Schema from "../schema/schema.js"

import { forEntries, getKeyIndex, getKeys } from "../utils.js"

export type Instance<
	S extends { [key in string]: Schema.Type } = { [key in string]: Schema.Type }
> = { readonly [key in keyof S]: Value<S[key]>[] }

export const instance = <S extends { [key in string]: Schema.Type }>(
	schema: S,
	instance: { [key in keyof S]: Value<S[key]>[] }
): Instance<S> => {
	for (const [{}, values] of forEntries(instance)) {
		Object.freeze(values)
	}
	return Object.freeze(instance)
}

export type Value<T extends Schema.Type = Schema.Type> = T extends Schema.Uri
	? Uri<string>
	: T extends Schema.Literal<infer Datatype>
	? Literal<Datatype>
	: T extends Schema.Product<infer Components>
	? Product<Components>
	: T extends Schema.Coproduct<infer Options>
	? Coproduct<Options>
	: T extends Schema.Reference
	? Reference
	: never

export class Reference {
	constructor(readonly type: Schema.Reference, readonly index: number) {
		Object.freeze(this)
	}
	public get kind(): "reference" {
		return "reference"
	}
}

export const reference = (type: Schema.Reference, index: number) =>
	new Reference(type, index)

export const isReference = (value: Value): value is Reference =>
	value.kind === "reference"

export class Uri<Value extends string = string> {
	constructor(readonly type: Schema.Uri, readonly value: Value) {
		Object.freeze(this)
	}
	public get kind(): "uri" {
		return "uri"
	}
}

export const uri = <Value extends string = string>(
	type: Schema.Uri,
	value: Value
) => new Uri(type, value)

export const isUri = (value: Value): value is Uri<string> =>
	value.kind === "uri"

export class Literal<Datatype extends string = string> {
	constructor(readonly type: Schema.Literal<Datatype>, readonly value: string) {
		Object.freeze(this)
	}
	public get kind(): "literal" {
		return "literal"
	}
}

export const literal = <Datatype extends string = string>(
	type: Schema.Literal<Datatype>,
	value: string
) => new Literal(type, value)

export const isLiteral = (value: Value): value is Literal<string> =>
	value.kind === "literal"

export class Product<
	Components extends Record<string, Schema.Type> = Record<string, Schema.Type>
> extends Array<Value<Components[keyof Components]>> {
	public get kind(): "product" {
		return "product"
	}
	readonly components: readonly (keyof Components)[]
	constructor(
		readonly type: Schema.Product<Components>,
		values: Iterable<Value<Components[keyof Components]>>
	) {
		super(...values)
		Object.freeze(this)
		this.components = getKeys(type.components)
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
			component: Value<Components[keyof Components]>,
			index: number,
			product: Product<Components>
		) => V
	): V[] {
		const result = new Array<V>(this.length)
		for (const [i, value] of this.entries()) {
			result[i] = f(value, i, this)
		}
		return result
	}
}

export const product = <
	Components extends Record<string, Schema.Type> = Record<string, Schema.Type>
>(
	product: Schema.Product<Components>,
	values: { readonly [key in keyof Components]: Value<Components[key]> }
) =>
	new Product<Components>(
		product,
		getKeys(product).map((key) => values[key])
	)

export const isProduct = (value: Value): value is Product =>
	value.kind === "product"

const unitType = Schema.unit()

export const unit = () => new Product<{}>(unitType, [])

export class Coproduct<
	Options extends Record<string, Schema.Type> = Record<string, Schema.Type>,
	Option extends keyof Options = keyof Options
> {
	readonly index: number
	readonly options: readonly (keyof Options)[]
	constructor(
		readonly type: Schema.Coproduct<Options>,
		readonly option: Option,
		readonly value: Value<Options[Option]>
	) {
		this.options = getKeys(type.options)
		this.index = this.options.indexOf(option)
		if (this.index in this.options) {
			Object.freeze(this)
		} else {
			throw new Error("Coproduct value index out of range")
		}
	}
	public get kind(): "coproduct" {
		return "coproduct"
	}
	is<Key extends keyof Options>(key: Key): this is Coproduct<Options, Key> {
		return (key as string) === (this.option as string)
	}
}

export const coproduct = <
	Options extends Record<string, Schema.Type> = Record<string, Schema.Type>,
	Option extends keyof Options = keyof Options
>(
	type: Schema.Coproduct<Options>,
	option: Option,
	value: Value<Options[Option]>
) => new Coproduct<Options, Option>(type, option, value)

export const isCoproduct = (value: Value): value is Coproduct =>
	value.kind === "coproduct"
