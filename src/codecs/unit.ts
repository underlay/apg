import { APG, getKeys } from "../index.js"

export type Unit = APG.Product<{}>

export const isUnit = (type: APG.Type): type is Unit =>
	type.type === "product" && getKeys(type.components).length === 0
