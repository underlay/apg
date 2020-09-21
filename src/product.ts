import { rdf } from "n3.ts"

import ShExParser from "@shexjs/parser"
import {
	SuccessResult,
	EachOfSolutions,
	OneOfSolutions,
	TripleConstraintSolutions,
} from "@shexjs/validator"

import { APG } from "./apg.js"
import {
	BlankNodeConstraintResult,
	anyTypeResult,
	isBlankNodeConstraintResult,
	isAnyTypeResult,
	BlankNodeConstraint,
	anyType,
	isAnyType,
	isBlankNodeConstraint,
	blankNodeConstraint,
} from "./utils.js"

export type ProductShape = {
	id: string
	type: "ShapeAnd"
	shapeExprs: [
		BlankNodeConstraint,
		{
			type: "Shape"
			closed: true
			expression: ProductExpression
		}
	]
}

export type ProductExpression = {
	type: "EachOf"
	expressions: [anyType, ...ComponentExpression[]]
}

export type ComponentExpression = {
	type: "TripleConstraint"
	predicate: string
	valueExpr: ShExParser.shapeExpr
}

function isProductExpression(
	tripleExpr: ShExParser.tripleExpr
): tripleExpr is ProductExpression {
	if (typeof tripleExpr === "string") {
		return false
	} else if (tripleExpr.type !== "EachOf") {
		return false
	} else if (tripleExpr.expressions.length === 0) {
		return false
	}
	const [first, ...rest] = tripleExpr.expressions
	return isAnyType(first) && rest.every(isComponentExpression)
}

function isComponentExpression(
	tripleExpr: ShExParser.tripleExpr
): tripleExpr is ComponentExpression {
	return (
		typeof tripleExpr !== "string" && tripleExpr.type === "TripleConstraint"
	)
}

export function isProductShape(
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is ProductShape {
	if (typeof shapeExpr === "string") {
		return false
	} else if (shapeExpr.type !== "ShapeAnd") {
		return false
	} else if (shapeExpr.shapeExprs.length !== 2) {
		return false
	}

	const [nodeConstraint, shape] = shapeExpr.shapeExprs

	if (typeof shape === "string") {
		return false
	} else if (shape.type !== "Shape") {
		return false
	} else if (shape.closed !== true) {
		return false
	} else if (shape.expression === undefined) {
		return false
	}

	return (
		isBlankNodeConstraint(nodeConstraint) &&
		isProductExpression(shape.expression)
	)
}

export function makeProductShape(id: string, type: APG.Product): ProductShape {
	const expression = makeProductExpression(type)
	return {
		id: id,
		type: "ShapeAnd",
		shapeExprs: [
			blankNodeConstraint,
			{ type: "Shape", closed: true, expression },
		],
	}
}

function makeProductExpression(type: APG.Product): ProductExpression {
	const expressions: [anyType, ...ComponentExpression[]] = [anyType]
	const values: Set<string> = new Set()
	for (const { key, value } of type.components) {
		if (key === rdf.type) {
			throw new Error("Product object cannot have an rdf:type component")
		} else if (values.has(key)) {
			throw new Error("Product objects cannot repeat component values")
		}
		values.add(key)
		expressions.push({
			type: "TripleConstraint",
			predicate: key,
			valueExpr: value,
		})
	}
	return { type: "EachOf", expressions }
}

export type ComponentResult = {
	type: "TripleConstraintSolutions"
	predicate: string
	valueExpr: ShExParser.shapeExpr
	solutions: [
		{
			type: "TestedTriple"
			subject: string
			predicate: string
			object: ShExParser.objectValue
			referenced?: SuccessResult
		}
	]
}

export function isComponentResult(
	result: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions
): result is ComponentResult {
	return (
		result.type === "TripleConstraintSolutions" && result.solutions.length === 1
	)
}

export type ProductResult = {
	type: "ShapeAndResults"
	solutions: [
		BlankNodeConstraintResult,
		{
			type: "ShapeTest"
			node: string
			shape: string
			solution: {
				type: "EachOfSolutions"
				solutions: [
					{
						type: "EachOfSolution"
						expressions: [anyTypeResult, ...ComponentResult[]]
					}
				]
			}
		}
	]
}

export function isProductResult(
	result: SuccessResult,
	id: string
): result is ProductResult {
	if (result.type !== "ShapeAndResults") {
		return false
	} else if (result.solutions.length !== 2) {
		return false
	}
	const [nodeConstraint, shape] = result.solutions
	if (shape.type !== "ShapeTest") {
		return false
	} else if (shape.shape !== id) {
		return false
	} else if (shape.solution.type !== "EachOfSolutions") {
		return false
	} else if (shape.solution.solutions.length !== 1) {
		return false
	}
	const [{ expressions }] = shape.solution.solutions
	const [first, ...rest] = expressions
	return (
		isBlankNodeConstraintResult(nodeConstraint) &&
		nodeConstraint.shape === id &&
		isAnyTypeResult(first) &&
		rest.every(isComponentResult)
	)
}

export function parseProductResult(result: ProductResult): ComponentResult[] {
	const [{}, shape] = result.solutions
	const [{ expressions }] = shape.solution.solutions
	const [{}, ...rest] = expressions
	return rest
}
