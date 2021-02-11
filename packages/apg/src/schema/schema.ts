import { getKeys } from "../utils"

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

export type Unit = Product<{}>

export const isUnit = (type: Type): type is Unit =>
	type.type === "product" && getKeys(type.components).length === 0

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
