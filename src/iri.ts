import ShExParser from "@shexjs/parser"
import { SuccessResult } from "@shexjs/validator"

import APG from "./apg.js"
import { isNodeConstraint } from "./utils.js"

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
	id: string
): result is IriResult {
	return (
		result.type === "NodeConstraintTest" &&
		result.shape === id &&
		isIriShape(result.shapeExpr)
	)
}

export function makeIriShape(id: string, {}: APG.Iri): IriShape {
	return {
		id: id,
		type: "NodeConstraint",
		nodeKind: "iri",
	}
}
