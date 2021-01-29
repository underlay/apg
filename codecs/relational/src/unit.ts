import { Schema, getKeys } from "@underlay/apg"

export type Unit = Schema.Product<{}>

export const isUnit = (type: Schema.Type): type is Unit =>
	type.type === "product" && getKeys(type.components).length === 0
