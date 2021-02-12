import * as Schema from "../schema/schema.js"

import { forEntries } from "../utils.js"

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
	constructor(readonly index: number) {
		Object.freeze(this)
	}
	public get kind(): "reference" {
		return "reference"
	}
}

export const reference = (index: number) => new Reference(index)

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

export const uri = <Value extends string = string>(value: Value) =>
	new Uri(value)

export const isUri = (value: Value): value is Uri<string> =>
	value.kind === "uri"

export class Literal<Datatype extends string = string> {
	constructor(readonly value: string, readonly datatype: Uri<Datatype>) {
		Object.freeze(this)
	}
	public get kind(): "literal" {
		return "literal"
	}
}

export const literal = <Datatype extends string = string>(
	value: string,
	datatype: Uri<Datatype>
) => new Literal(value, datatype)

export const isLiteral = (value: Value): value is Literal<string> =>
	value.kind === "literal"

export class Product<
	Components extends { [key in string]: Schema.Type } = {
		[key in string]: Schema.Type
	}
> extends Array<Value<Components[keyof Components]>> {
	public get kind(): "product" {
		return "product"
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
			record: Product<Components>
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
	Components extends { [key in string]: Schema.Type } = {
		[key in string]: Schema.Type
	}
>(
	components: readonly (keyof Components)[],
	values: Iterable<Value<Components[keyof Components]>>
) => new Product<Components>(components, values)

export const isProduct = (value: Value): value is Product =>
	value.kind === "product"

const unitKeys: [] = []
const unitValues: [] = []
export const unit = () => new Product<{}>(unitKeys, unitValues)

export class Coproduct<
	Options extends { [key in string]: Schema.Type } = {
		[key in string]: Schema.Type
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
			throw new Error("Coproduct value index out of range")
		}
	}
	public get kind(): "coproduct" {
		return "coproduct"
	}
	is<Key extends keyof Options>(key: Key): this is Coproduct<Options, Key> {
		return (key as string) === (this.key as string)
	}
}

export const coproduct = <
	Options extends { [key in string]: Schema.Type } = {
		[key in string]: Schema.Type
	},
	Option extends keyof Options = keyof Options
>(
	options: readonly (keyof Options)[],
	key: Option,
	value: Value<Options[Option]>
) => new Coproduct<Options, Option>(options, key, value)

export const isCoproduct = (value: Value): value is Coproduct =>
	value.kind === "coproduct"
