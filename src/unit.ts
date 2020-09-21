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
import { APG } from "./index.js"

type emptyShape = {
	type: "Shape"
	closed: true
	expression: anyType
}

const emptyShape: emptyShape = {
	type: "Shape",
	closed: true,
	expression: anyType,
}

function isEmptyShape(
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is emptyShape {
	return shapeExpr === emptyShape
}

export type UnitShape = {
	id: string
	type: "ShapeAnd"
	shapeExprs: [BlankNodeConstraint, emptyShape]
}

export function makeUnitShape(id: string, {}: APG.Unit): UnitShape {
	return {
		id: id,
		type: "ShapeAnd",
		shapeExprs: [blankNodeConstraint, emptyShape],
	}
}

export function isUnitShapeExpr(
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is UnitShape {
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

type EmptyShapeResult = {
	type: "ShapeTest"
	node: string
	shape: string
	solution: anyTypeResult
}

function isEmptyShapeResult(result: SuccessResult): result is EmptyShapeResult {
	return result.type === "ShapeTest" && isAnyTypeResult(result.solution)
}

export type UnitResult = {
	type: "ShapeAndResults"
	solutions: [BlankNodeConstraintResult, EmptyShapeResult]
}

export function isUnitResult(
	result: SuccessResult,
	id: string
): result is UnitResult {
	if (result.type !== "ShapeAndResults") {
		return false
	} else if (result.solutions.length !== 2) {
		return false
	}
	const [nodeConstraint, shape] = result.solutions
	return (
		isBlankNodeConstraintResult(nodeConstraint) &&
		nodeConstraint.shape === id &&
		isEmptyShapeResult(shape) &&
		shape.shape === id
	)
}
