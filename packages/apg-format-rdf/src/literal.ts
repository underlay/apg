import { Schema } from "@underlay/apg"

import { SuccessResult } from "shex/packages/shex-validator"
import ShExParser from "shex/packages/shex-parser"

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
	id: string
): result is LiteralResult {
	return (
		result.type === "NodeConstraintTest" &&
		result.shape === id &&
		isLiteralShape(result.shapeExpr)
	)
}

export function makeLiteralShape(
	id: string,
	{ datatype }: Schema.Literal
): LiteralShape {
	return { id, type: "NodeConstraint", datatype }
}
