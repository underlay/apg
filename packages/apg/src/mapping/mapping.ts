export * from "./utils.js"
export * from "./apply.js"

export type Expression = Term | Tuple | Injection
export type Term =
	| Identity
	| Identifier
	| Constant
	| Dereference
	| Projection
	| Match

export interface Identity {
	readonly kind: "identity"
}

export interface Identifier<Value extends string = string> {
	readonly kind: "identifier"
	readonly value: Value
}

export const identifier = (value: string): Identifier =>
	Object.freeze({ kind: "identifier", value })

export interface Constant {
	readonly kind: "constant"
	readonly value: string
}

export const constant = (value: string): Constant =>
	Object.freeze({ kind: "constant", value })

export interface Dereference<Key extends string = string> {
	readonly kind: "dereference"
	readonly key: Key
	readonly term: Term
}

export const dereference = <Key extends string = string>(
	key: Key,
	term: Term
): Dereference<Key> => Object.freeze({ kind: "dereference", key, term })

export interface Projection<Key extends string = string> {
	readonly kind: "projection"
	readonly key: Key
	readonly term: Term
}

export const projection = <Key extends string = string>(
	key: Key,
	term: Term
): Projection<Key> => Object.freeze({ kind: "projection", key, term })

export interface Injection<Key extends string = string> {
	readonly kind: "injection"
	readonly key: Key
	readonly expression: Expression
}

export const injection = <Key extends string = string>(
	key: Key,
	expression: Expression
): Injection<Key> => Object.freeze({ kind: "injection", key, expression })

export interface Tuple<
	Slots extends Record<string, Expression> = Record<string, Expression>
> {
	readonly kind: "tuple"
	readonly slots: Readonly<Slots>
}

export const tuple = <Slots extends Record<string, Expression>>(
	slots: Readonly<Slots>
): Tuple<Slots> => Object.freeze({ kind: "tuple", slots: Object.freeze(slots) })

export interface Match<
	Cases extends Record<string, Term> = Record<string, Term>
> {
	readonly kind: "match"
	readonly cases: Readonly<Cases>
}

export const match = <Cases extends Record<string, Term>>(
	cases: Readonly<Cases>
): Match<Cases> => Object.freeze({ kind: "match", cases: Object.freeze(cases) })

export interface Map {
	readonly kind: "map"
	readonly source: string
	readonly value: Expression
}

export const map = (source: string, value: Expression): Map =>
	Object.freeze({ kind: "map", source, value })

export type Mapping = { readonly [key: string]: Map }

export const mapping = (maps: { readonly [key: string]: Map }): Mapping =>
	Object.freeze(maps)
