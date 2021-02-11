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
	readonly type: "identifier"
	readonly value: Value
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

export interface Injection<Key extends string = string> {
	readonly type: "injection"
	readonly key: Key
}

export const injection = <Key extends string = string>(
	key: Key
): Injection<Key> => Object.freeze({ type: "injection", key })

export interface Tuple {
	readonly type: "tuple"
	readonly slots: { readonly [key in string]: Expression[] }
}

export const tuple = (
	slots: { readonly [key in string]: Expression[] }
): Tuple => Object.freeze({ type: "tuple", slots: Object.freeze(slots) })

export interface Match {
	readonly type: "match"
	readonly cases: { readonly [key in string]: Expression[] }
}

export const match = (
	cases: { readonly [key in string]: Expression[] }
): Match => Object.freeze({ type: "match", cases: Object.freeze(cases) })

export interface Map {
	readonly type: "map"
	readonly source: string
	readonly value: readonly Expression[]
}

export const map = (source: string, value: readonly Expression[]): Map =>
	Object.freeze({ type: "map", source, value })

export type Mapping = { readonly [key: string]: Map }

export const mapping = (maps: { readonly [key: string]: Map }): Mapping =>
	Object.freeze(maps)
