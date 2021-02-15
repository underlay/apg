import { getKeys } from "../utils"

export type Schema<
	S extends { [key in string]: Type } = { [key in string]: Type }
> = Readonly<S>

export const schema = <S extends { [key in string]: Type }>(
	labels: S
): Schema<S> => Object.freeze(labels)

export type Type = Uri | Literal | Product | Coproduct | Reference

export interface Reference<T extends string = string> {
	readonly kind: "reference"
	readonly value: T
}

export const reference = <T extends string>(value: T): Reference<T> =>
	Object.freeze({ kind: "reference", value })

export const isReference = (type: Type): type is Reference =>
	type.kind === "reference"

export interface Uri {
	readonly kind: "uri"
}

export const uri = (): Uri => Object.freeze({ kind: "uri" })

export const isUri = (type: Type): type is Uri => type.kind === "uri"

export interface Literal<T extends string = string> {
	readonly kind: "literal"
	readonly datatype: T
}

export const literal = <T extends string>(datatype: T): Literal<T> =>
	Object.freeze({ kind: "literal", datatype })

export const isLiteral = (type: Type): type is Literal =>
	type.kind === "literal"

export interface Product<
	Components extends Record<string, Type> = Record<string, Type>
> {
	readonly kind: "product"
	readonly components: Readonly<Components>
}

export const product = <
	Components extends Record<string, Type> = Record<string, Type>
>(
	components: Components
): Product<Components> =>
	Object.freeze({ kind: "product", components: Object.freeze(components) })

export const isProduct = (type: Type): type is Product =>
	type.kind === "product"

export type Unit = Product<{}>

export const unit = () => product({})

export const isUnit = (type: Type): type is Unit =>
	type.kind === "product" && getKeys(type.components).length === 0

export interface Coproduct<
	Options extends Record<string, Type> = Record<string, Type>
> {
	readonly kind: "coproduct"
	readonly options: Readonly<Options>
}

export const coproduct = <
	Options extends Record<string, Type> = Record<string, Type>
>(
	options: Options
): Coproduct<Options> =>
	Object.freeze({ kind: "coproduct", options: Object.freeze(options) })

export const isCoproduct = (type: Type): type is Coproduct =>
	type.kind === "coproduct"
