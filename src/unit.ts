import { SuccessResult } from "@shexjs/validator"

import {
	BlankNodeConstraint,
	BlankNodeConstraintResult,
	isBlankNodeConstraintResult,
	anyType,
	anyTypeResult,
	isAnyTypeResult,
	blankNodeConstraint,
	getBlankNodeId,
} from "./utils.js"
import APG from "./apg.js"

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

export type UnitShape = {
	id: string
	type: "ShapeAnd"
	shapeExprs: [BlankNodeConstraint, emptyShape]
}

export function makeUnitShape(id: string, {}: APG.Unit): UnitShape {
	return {
		id: getBlankNodeId(id),
		type: "ShapeAnd",
		shapeExprs: [blankNodeConstraint, emptyShape],
	}
}

type EmptyShapeResult = {
	type: "ShapeTest"
	node: string
	shape: string
	solution: anyTypeResult
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
	const blankNodeId = getBlankNodeId(id)
	const [nodeConstraint, shape] = result.solutions
	return (
		isBlankNodeConstraintResult(nodeConstraint) &&
		nodeConstraint.shape === blankNodeId &&
		isEmptyShapeResult(shape) &&
		shape.shape === blankNodeId
	)
}

function isEmptyShapeResult(result: SuccessResult): result is EmptyShapeResult {
	return result.type === "ShapeTest" && isAnyTypeResult(result.solution)
}
