import { Schema } from "@underlay/apg"

import ShExParser from "shex/packages/shex-parser"
import { SuccessResult } from "shex/packages/shex-validator"

import { isNodeConstraint } from "./utils.js"

export type UriShape = { id: string; type: "NodeConstraint"; nodeKind: "iri" }

export const isUriShape = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is UriShape =>
	isNodeConstraint(shapeExpr) &&
	shapeExpr.nodeKind === "iri" &&
	shapeExpr.hasOwnProperty("id")

export type UriResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: UriShape
}

export function isUriResult(
	result: SuccessResult,
	id: string
): result is UriResult {
	return (
		result.type === "NodeConstraintTest" &&
		result.shape === id &&
		isUriShape(result.shapeExpr)
	)
}

export function makeUriShape(id: string, {}: Schema.Uri): UriShape {
	return {
		id: id,
		type: "NodeConstraint",
		nodeKind: "iri",
	}
}
