import * as Schema from "../schema/schema.js"

import { forEntries, getKeyIndex, getKeys } from "../utils.js"

export type Instance<
	S extends Record<string, Schema.Type> = Record<string, Schema.Type>
> = { readonly [key in keyof S]: Value<S[key]>[] }

export const instance = <S extends Record<string, Schema.Type>>(
	schema: S,
	instance: { [key in keyof S]: Value<S[key]>[] }
): Instance<S> => {
	for (const [_, values] of forEntries(instance)) {
		Object.freeze(values)
	}
	return Object.freeze(instance)
}

export type Value<T extends Schema.Type = Schema.Type> = T extends Schema.Uri
	? Uri<string>
	: T extends Schema.Literal
	? Literal
	: T extends Schema.Product<infer Components>
	? Product<Components>
	: T extends Schema.Coproduct<infer Options>
	? Coproduct<Options>
	: T extends Schema.Reference
	? Reference
	: never

export class Reference {
	constructor(readonly index: number) {
		Object.freeze(this)
	}
	public get kind(): "reference" {
		return "reference"
	}
}

export const reference = (type: Schema.Reference, index: number) =>
	new Reference(index)

export const isReference = (value: Value): value is Reference =>
	value.kind === "reference"

export class Uri<Value extends string = string> {
	constructor(readonly value: Value) {
		Object.freeze(this)
	}
	public get kind(): "uri" {
		return "uri"
	}
}

export const uri = <Value extends string = string>(
	type: Schema.Uri,
	value: Value
) => new Uri(value)

export const isUri = (value: Value): value is Uri<string> =>
	value.kind === "uri"

export class Literal {
	constructor(readonly value: string) {
		Object.freeze(this)
	}
	public get kind(): "literal" {
		return "literal"
	}
}

export const literal = <Datatype extends string = string>(
	type: Schema.Literal<Datatype>,
	value: string
) => new Literal(value)

export const isLiteral = (value: Value): value is Literal =>
	value.kind === "literal"

export class Product<
	Components extends Record<string, Schema.Type> = Record<string, Schema.Type>
> extends Array<Value<Components[keyof Components]>> {
	public get kind(): "product" {
		return "product"
	}

	constructor(values: Iterable<Value<Components[keyof Components]>>) {
		super(...values)
		Object.freeze(this)
	}

	get<K extends keyof Components>(
		type: Schema.Product<Components>,
		key: K
	): Value<Components[K]> {
		const index = getKeyIndex(type.components, key as string)
		if (index in this) {
			return this[index] as Value<Components[K]>
		} else {
			throw new Error(`Index out of range: ${index}`)
		}
	}
}

export const product = <
	Components extends Record<string, Schema.Type> = Record<string, Schema.Type>
>(
	type: Schema.Product<Components>,
	components: { readonly [key in keyof Components]: Value<Components[key]> }
) =>
	new Product<Components>(
		getKeys(type.components).map((key) => components[key])
	)

export const isProduct = (value: Value): value is Product =>
	value.kind === "product"

export const unit = (type: Schema.Unit) => new Product<{}>([])

export const isUnit = (value: Value): value is Product<{}> =>
	value.kind === "product" && value.length === 0

export class Coproduct<
	Options extends Record<string, Schema.Type> = Record<string, Schema.Type>,
	Option extends keyof Options = keyof Options
> {
	constructor(readonly index: number, readonly value: Value<Options[Option]>) {
		Object.freeze(this)
	}
	public get kind(): "coproduct" {
		return "coproduct"
	}
	key(type: Schema.Coproduct<Options>): Option {
		const keys = getKeys(type.options)
		if (this.index in keys) {
			return keys[this.index] as Option
		} else {
			throw new Error(`Index out of range: ${this.index}`)
		}
	}
	is<Key extends keyof Options>(
		type: Schema.Coproduct<Options>,
		key: Key
	): this is Coproduct<Options, Key> {
		return getKeyIndex(type.options, key as string) === this.index
	}
}

export const coproduct = <
	Options extends Record<string, Schema.Type> = Record<string, Schema.Type>,
	Option extends keyof Options = keyof Options
>(
	type: Schema.Coproduct<Options>,
	key: Option,
	value: Value<Options[Option]>
) =>
	new Coproduct<Options, Option>(
		getKeyIndex(type.options, key as string),
		value
	)

export const isCoproduct = (value: Value): value is Coproduct =>
	value.kind === "coproduct"
