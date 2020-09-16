import ShExParser from "@shexjs/parser"
import { SuccessResult } from "@shexjs/validator"

import { IriType } from "./schema.js"
import { NamedNodeConstraint, isNamedNodeConstraint } from "./utils.js"
import { emptyShape, EmptyShapeResult, isEmptyShapeResult } from "./nil.js"
import { isEmptyShape } from "./nil.js"

type IriShape = {
	type: "ShapeAnd"
	shapeExprs: [NamedNodeConstraint, emptyShape]
}

export function isIriShape(
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is IriShape {
	if (
		typeof shapeExpr !== "string" &&
		shapeExpr.type === "ShapeAnd" &&
		shapeExpr.shapeExprs.length === 2
	) {
		const [nodeConstraint, shape] = shapeExpr.shapeExprs
		// console.log(
		// 	"okay",
		// 	isNamedNodeConstraint(nodeConstraint),
		// 	isEmptyShape(shape)
		// )
		return isNamedNodeConstraint(nodeConstraint) && isEmptyShape(shape)
	}
	return false
}

export function parseIriShape(shapeExpr: IriShape): NamedNodeConstraint {
	const [nodeConstraint] = shapeExpr.shapeExprs
	return nodeConstraint
}

export type IriResult = {
	type: "ShapeAndResults"
	solutions: [NamedNodeConstraintResult, EmptyShapeResult]
}

export type NamedNodeConstraintResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: NamedNodeConstraint
}

export function isNamedNodeConstraintResult(
	result: SuccessResult
): result is NamedNodeConstraintResult {
	return (
		result.type === "NodeConstraintTest" &&
		isNamedNodeConstraint(result.shapeExpr)
	)
}

export function isIriResult(result: SuccessResult): result is IriResult {
	if (result.type === "ShapeAndResults" && result.solutions.length === 2) {
		const [nodeTest, shape] = result.solutions
		return isNamedNodeConstraintResult(nodeTest) && isEmptyShapeResult(shape)
	}
	return false
}

export function makeIriShape({ type, ...rest }: IriType): IriShape {
	return {
		type: "ShapeAnd",
		shapeExprs: [
			{ type: "NodeConstraint", nodeKind: "iri", ...rest },
			emptyShape,
		],
	}
}
