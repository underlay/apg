export * from "./utils.js"
export * from "./apply.js"

export type Expression =
	| Identifier
	| Constant
	| Dereference
	| Projection
	| Injection
	| Tuple
	| Match

export interface Identifier<Value extends string = string> {
	readonly kind: "identifier"
	readonly value: Value
}

export const identifier = <Value extends string>(
	value: Value
): Identifier<Value> => Object.freeze({ kind: "identifier", value })

export interface Constant<
	Datatype extends string = string,
	Value extends string = string
> {
	readonly kind: "constant"
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
	Object.freeze({ kind: "constant", value, datatype })

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

export interface Tuple {
	readonly kind: "tuple"
	readonly slots: { readonly [key in string]: Expression[] }
}

export const tuple = (
	slots: { readonly [key in string]: Expression[] }
): Tuple => Object.freeze({ kind: "tuple", slots: Object.freeze(slots) })

export interface Match {
	readonly kind: "match"
	readonly cases: { readonly [key in string]: Expression[] }
}

export const match = (
	cases: { readonly [key in string]: Expression[] }
): Match => Object.freeze({ kind: "match", cases: Object.freeze(cases) })

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
