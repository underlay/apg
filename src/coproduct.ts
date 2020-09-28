import { SuccessResult, ShapeOrResults } from "@shexjs/validator"

import APG from "./apg.js"
import { getBlankNodeId } from "./utils.js"

export function isShapeOrResult(
	result: SuccessResult
): result is ShapeOrResults {
	return result.type === "ShapeOrResults"
}

export type CoproductShape = {
	id: string
	type: "ShapeOr"
	shapeExprs: string[]
}

export function makeCoproductShape(
	id: string,
	type: APG.Coproduct
): CoproductShape {
	return {
		id: getBlankNodeId(id),
		type: "ShapeOr",
		shapeExprs: Array.from(type.options.values()).map(({ value }) =>
			getBlankNodeId(value)
		),
	}
}
