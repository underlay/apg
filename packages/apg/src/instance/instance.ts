import * as Schema from "../schema/schema.js"

import {
	forEntries,
	getKeyIndex,
	getKeys,
	signalInvalidType,
} from "../utils.js"

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
	? Uri
	: T extends Schema.Literal
	? Literal
	: T extends Schema.Product<infer Components>
	? Product<Components>
	: T extends Schema.Coproduct<infer Options>
	? Coproduct<Options>
	: T extends Schema.Reference<infer T>
	? Reference<T>
	: never

type ValueObject =
	| UriObject
	| LiteralObject
	| ProductObject
	| CoproductObject
	| ReferenceObject

export function fromJSON(value: ValueObject): Value {
	if (value.kind === "reference") {
		return Reference.fromJSON(value)
	} else if (value.kind === "uri") {
		return Uri.fromJSON(value)
	} else if (value.kind === "literal") {
		return Literal.fromJSON(value)
	} else if (value.kind === "product") {
		return Product.fromJSON(value)
	} else if (value.kind === "coproduct") {
		return Coproduct.fromJSON(value)
	} else {
		signalInvalidType(value)
	}
}

type ReferenceObject = { kind: "reference"; index: number }

export class Reference<T extends string> {
	public static fromJSON({ index }: ReferenceObject): Reference<string> {
		return new Reference(index)
	}

	constructor(readonly index: number) {
		Object.freeze(this)
	}

	public get kind(): "reference" {
		return "reference"
	}

	public toJSON(): ReferenceObject {
		return { kind: "reference", index: this.index }
	}
}

export const reference = <T extends string>(
	type: Schema.Reference<T>,
	index: number
) => new Reference<T>(index)

export const isReference = (value: Value): value is Reference<string> =>
	value.kind === "reference"

type UriObject = { kind: "uri"; value: string }

export class Uri {
	public static fromJSON({ value }: UriObject) {
		return new Uri(value)
	}

	constructor(readonly value: string) {
		Object.freeze(this)
	}

	public get kind(): "uri" {
		return "uri"
	}

	public toJSON(): UriObject {
		return { kind: "uri", value: this.value }
	}
}

export const uri = (type: Schema.Uri, value: string) => new Uri(value)

export const isUri = (value: Value): value is Uri => value.kind === "uri"

type LiteralObject = { kind: "literal"; value: string }

export class Literal {
	public static fromJSON({ value }: LiteralObject): Literal {
		return new Literal(value)
	}

	constructor(readonly value: string) {
		Object.freeze(this)
	}

	public get kind(): "literal" {
		return "literal"
	}

	public toJSON(): LiteralObject {
		return { kind: "literal", value: this.value }
	}
}

export const literal = <Datatype extends string = string>(
	type: Schema.Literal<Datatype>,
	value: string
) => new Literal(value)

export const isLiteral = (value: Value): value is Literal =>
	value.kind === "literal"

type ProductObject = { kind: "product"; components: ValueObject[] }

export class Product<
	Components extends Record<string, Schema.Type> = Record<string, Schema.Type>
> extends Array<Value<Components[keyof Components]>> {
	public static fromJSON({
		components,
	}: ProductObject): Product<Record<string, Schema.Type>> {
		return new Product(components.map(fromJSON))
	}

	public get kind(): "product" {
		return "product"
	}

	constructor(values: Iterable<Value<Components[keyof Components]>>) {
		super(...values)
		Object.freeze(this)
	}

	public toJSON(): ProductObject {
		return { kind: "product", components: this.map((value) => value.toJSON()) }
	}

	public map<V>(
		f: (
			value: Value<Components[keyof Components]>,
			index: number,
			array: Value<Components[keyof Components]>[]
		) => V
	): V[] {
		const result: V[] = new Array(this.length)
		for (const [i, value] of this.entries()) {
			result[i] = f(value, i, this)
		}
		return result
	}

	public get<K extends keyof Components>(
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

type CoproductObject = { kind: "coproduct"; index: number; value: ValueObject }

export class Coproduct<
	Options extends Record<string, Schema.Type> = Record<string, Schema.Type>,
	Option extends keyof Options = keyof Options
> {
	public static fromJSON({ index, value }: CoproductObject) {
		return new Coproduct(index, fromJSON(value))
	}

	constructor(readonly index: number, readonly value: Value<Options[Option]>) {
		Object.freeze(this)
	}

	public get kind(): "coproduct" {
		return "coproduct"
	}

	public toJSON(): CoproductObject {
		return { kind: "coproduct", index: this.index, value: this.value.toJSON() }
	}

	public key(type: Schema.Coproduct<Options>): Option {
		const keys = getKeys(type.options)
		if (this.index in keys) {
			return keys[this.index] as Option
		} else {
			throw new Error(`Index out of range: ${this.index}`)
		}
	}

	public is<Key extends keyof Options>(
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
