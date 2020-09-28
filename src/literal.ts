import { SuccessResult } from "@shexjs/validator"
import ShExParser from "@shexjs/parser"

import { APG } from "./apg.js"
import { getBlankNodeId } from "./utils.js"

type literalShape = { id: string; type: "NodeConstraint"; datatype: string }
type patternLiteralShape = literalShape & { pattern: string; flags: string }
export type LiteralShape = literalShape | patternLiteralShape

export const isLiteralShape = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is LiteralShape =>
	typeof shapeExpr !== "string" &&
	shapeExpr.type === "NodeConstraint" &&
	shapeExpr.hasOwnProperty("datatype")

export type LiteralResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: LiteralShape
}

export function isLiteralResult(
	result: SuccessResult,
	value: string | APG.Reference
): result is LiteralResult {
	return (
		result.type === "NodeConstraintTest" &&
		result.shape === getBlankNodeId(value) &&
		isLiteralShape(result.shapeExpr)
	)
}

export function makeLiteralShape(
	id: string,
	{ type, datatype, ...rest }: APG.Literal
): LiteralShape {
	return { id: getBlankNodeId(id), type: "NodeConstraint", datatype, ...rest }
}
