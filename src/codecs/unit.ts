import * as APG from "../apg.js"
import { getKeys } from "../utils.js"

export type Unit = APG.Product<{}>

export const isUnit = (type: APG.Type): type is Unit =>
	type.type === "product" && getKeys(type.components).length === 0
