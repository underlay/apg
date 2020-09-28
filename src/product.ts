import { rdf } from "n3.ts"

import ShExParser from "@shexjs/parser"
import {
	SuccessResult,
	EachOfSolutions,
	OneOfSolutions,
	TripleConstraintSolutions,
} from "@shexjs/validator"

import APG from "./apg.js"
import {
	BlankNodeConstraintResult,
	anyTypeResult,
	isBlankNodeConstraintResult,
	isAnyTypeResult,
	BlankNodeConstraint,
	anyType,
	blankNodeConstraint,
	getBlankNodeId,
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
	id: string
	type: "TripleConstraint"
	predicate: string
	valueExpr: ShExParser.shapeExpr
}

export function makeProductShape(id: string, type: APG.Product): ProductShape {
	console.log("making product shape", id, getBlankNodeId(id))
	const expression = makeProductExpression(type)
	return {
		id: getBlankNodeId(id),
		type: "ShapeAnd",
		shapeExprs: [
			blankNodeConstraint,
			{ type: "Shape", closed: true, expression },
		],
	}
}

function makeProductExpression(type: APG.Product): ProductExpression {
	const expressions: [anyType, ...ComponentExpression[]] = [anyType]
	const keys: Set<string> = new Set()
	for (const [id, { key, value }] of type.components) {
		if (key === rdf.type) {
			throw new Error("Product object cannot have an rdf:type component")
		} else if (keys.has(key)) {
			throw new Error("Product objects cannot repeat component keys")
		}
		keys.add(key)
		expressions.push({
			id: getBlankNodeId(id),
			type: "TripleConstraint",
			predicate: key,
			valueExpr: getBlankNodeId(value),
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
	const blankNodeId = getBlankNodeId(id)
	if (result.type !== "ShapeAndResults") {
		return false
	} else if (result.solutions.length !== 2) {
		return false
	}
	const [nodeConstraint, shape] = result.solutions
	if (shape.type !== "ShapeTest") {
		return false
	} else if (shape.shape !== blankNodeId) {
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
		nodeConstraint.shape === blankNodeId &&
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
