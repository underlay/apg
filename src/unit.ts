import ShExParser from "@shexjs/parser"
import { SuccessResult } from "@shexjs/validator"

import {
	BlankNodeConstraint,
	isBlankNodeConstraint,
	BlankNodeConstraintResult,
	isBlankNodeConstraintResult,
	anyType,
	anyTypeResult,
	isAnyTypeResult,
	blankNodeConstraint,
} from "./utils.js"

export interface emptyShape extends ShExParser.Shape {
	closed: true
	expression: anyType
}

export const emptyShape: emptyShape = {
	type: "Shape",
	closed: true,
	expression: anyType,
}

export function isEmptyShape(
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is emptyShape {
	return shapeExpr === emptyShape
}

type unitShapeExpr = {
	type: "ShapeAnd"
	shapeExprs: [BlankNodeConstraint, emptyShape]
}

export const unitShapeExpr: unitShapeExpr = {
	type: "ShapeAnd",
	shapeExprs: [blankNodeConstraint, emptyShape],
}

export function isUnitShapeExpr(
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is unitShapeExpr {
	if (typeof shapeExpr === "string") {
		return false
	} else if (shapeExpr.type !== "ShapeAnd") {
		return false
	} else if (shapeExpr.shapeExprs.length !== 2) {
		return false
	}
	const [nodeConstraint, shape] = shapeExpr.shapeExprs
	return isBlankNodeConstraint(nodeConstraint) && isEmptyShape(shape)
}

export type EmptyShapeResult = {
	type: "ShapeTest"
	node: string
	shape: string
	solution: anyTypeResult
}

export function isEmptyShapeResult(
	result: SuccessResult
): result is EmptyShapeResult {
	return result.type === "ShapeTest" && isAnyTypeResult(result.solution)
}

export type UnitShapeResult = {
	type: "ShapeAndResults"
	solutions: [BlankNodeConstraintResult, EmptyShapeResult]
}

export function isUnitShapeResult(
	result: SuccessResult
): result is UnitShapeResult {
	if (result.type !== "ShapeAndResults") {
		return false
	} else if (result.solutions.length !== 2) {
		return false
	}
	const [nodeConstraint, shape] = result.solutions
	return (
		isBlankNodeConstraintResult(nodeConstraint) && isEmptyShapeResult(shape)
	)
}
