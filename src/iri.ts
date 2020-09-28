import ShExParser from "@shexjs/parser"
import { SuccessResult } from "@shexjs/validator"

import { APG } from "./apg.js"
import { getBlankNodeId, isNodeConstraint } from "./utils.js"

type iriShape = { id: string; type: "NodeConstraint"; nodeKind: "iri" }
type patternIriShape = iriShape & { pattern: string; flags: string }
export type IriShape = iriShape | patternIriShape

export const isIriShape = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is IriShape =>
	isNodeConstraint(shapeExpr) &&
	shapeExpr.nodeKind === "iri" &&
	shapeExpr.hasOwnProperty("id")

export type IriResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: IriShape
}

export function isIriResult(
	result: SuccessResult,
	value: string | APG.Reference
): result is IriResult {
	return (
		result.type === "NodeConstraintTest" &&
		result.shape === getBlankNodeId(value) &&
		isIriShape(result.shapeExpr)
	)
}

export function makeIriShape(id: string, { type, ...rest }: APG.Iri): IriShape {
	return {
		id: getBlankNodeId(id),
		type: "NodeConstraint",
		nodeKind: "iri",
		...rest,
	}
}
