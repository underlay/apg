import ShExParser from "@shexjs/parser"
import { SuccessResult, ShapeOrResults } from "@shexjs/validator"

import { APG } from "./apg.js"

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

export function isCoproductShape(
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is CoproductShape {
	return (
		typeof shapeExpr !== "string" &&
		shapeExpr.id !== undefined &&
		shapeExpr.type === "ShapeOr" &&
		shapeExpr.shapeExprs.every((shapeExpr) => typeof shapeExpr === "string")
	)
}

export function makeCoproductShape(
	id: string,
	type: APG.Coproduct
): CoproductShape {
	return {
		id,
		type: "ShapeOr",
		shapeExprs: type.options.map(({ value }) => value),
	}
}
