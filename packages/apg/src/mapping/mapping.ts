export * from "./utils.js"
export * from "./apply.js"

export type Expression =
	| Uri
	| Literal
	| Dereference
	| Projection
	| Injection
	| Product
	| Coproduct

export interface Uri<Value extends string = string> {
	readonly kind: "uri"
	readonly value: Value
}

export const uri = <Value extends string>(value: Value): Uri<Value> =>
	Object.freeze({ kind: "uri", value })

export interface Literal<
	Datatype extends string = string,
	Value extends string = string
> {
	readonly kind: "literal"
	readonly value: Value
	readonly datatype: Datatype
}

export const literal = <
	Datatype extends string = string,
	Value extends string = string
>(
	value: Value,
	datatype: Datatype
): Literal<Datatype, Value> =>
	Object.freeze({ kind: "literal", value, datatype })

export interface Dereference<Key extends string = string> {
	readonly kind: "dereference"
	readonly key: Key
}

export const dereference = <Key extends string = string>(
	key: Key
): Dereference<Key> => Object.freeze({ kind: "dereference", key })

export interface Projection<Key extends string = string> {
	readonly kind: "projection"
	readonly key: Key
}

export const projection = <Key extends string = string>(
	key: Key
): Projection<Key> => Object.freeze({ kind: "projection", key })

export interface Injection<Key extends string = string> {
	readonly kind: "injection"
	readonly key: Key
}

export const injection = <Key extends string = string>(
	key: Key
): Injection<Key> => Object.freeze({ kind: "injection", key })

export interface Product<
	Components extends Record<string, Expression[]> = Record<string, Expression[]>
> {
	readonly kind: "product"
	readonly components: Readonly<Components>
}

export const product = <Components extends Record<string, Expression[]>>(
	components: Components
): Product<Components> =>
	Object.freeze({ kind: "product", components: Object.freeze(components) })

export interface Coproduct<
	Options extends Record<string, Expression[]> = Record<string, Expression[]>
> {
	readonly kind: "coproduct"
	readonly options: Readonly<Options>
}

export const coproduct = <Options extends Record<string, Expression[]>>(
	options: Options
): Coproduct<Options> =>
	Object.freeze({ kind: "coproduct", options: Object.freeze(options) })

export interface Map {
	readonly kind: "map"
	readonly source: string
	readonly value: readonly Expression[]
}

export const map = (source: string, value: readonly Expression[]): Map =>
	Object.freeze({ kind: "map", source, value })

export type Mapping = { readonly [key: string]: Map }

export const mapping = (maps: { readonly [key: string]: Map }): Mapping =>
	Object.freeze(maps)
