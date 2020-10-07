import ShExParser from "@shexjs/parser"
import {
	SuccessResult,
	EachOfSolutions,
	OneOfSolutions,
	TripleConstraintSolutions,
} from "@shexjs/validator"

import { rdf } from "n3.ts"

import APG from "./apg.js"
import {
	anyType,
	anyTypeResult,
	blankNodeConstraint,
	BlankNodeConstraint,
	BlankNodeConstraintResult,
	getBlankNodeId,
	isAnyTypeResult,
	isBlankNodeConstraintResult,
} from "./utils.js"

export type CoproductShape = {
	id: string
	type: "ShapeAnd"
	shapeExprs: [
		BlankNodeConstraint,
		{
			type: "Shape"
			closed: true
			expression: CoproductExpression
		}
	]
}

export type CoproductExpression = {
	type: "EachOf"
	expressions: [
		anyType,
		{
			type: "OneOf"
			expressions: OptionExpression[]
		}
	]
}

export type OptionExpression = {
	id: string
	type: "TripleConstraint"
	predicate: string
	valueExpr: string
}

export function makeCoproductShape(
	id: string,
	type: APG.Coproduct
): CoproductShape {
	const expression = makeCoproductExpression(type)
	return {
		id: getBlankNodeId(id),
		type: "ShapeAnd",
		shapeExprs: [
			blankNodeConstraint,
			{ type: "Shape", closed: true, expression },
		],
	}
}

function makeCoproductExpression(type: APG.Coproduct): CoproductExpression {
	const expressions: OptionExpression[] = []
	const keys: Set<string> = new Set()
	for (const [id, { key, value }] of type.options) {
		if (key === rdf.type) {
			throw new Error("Coproduct object cannot have an rdf:type option")
		} else if (keys.has(key)) {
			throw new Error("Coproduct objects cannot repeat option keys")
		}
		keys.add(key)
		expressions.push({
			id: getBlankNodeId(id),
			type: "TripleConstraint",
			predicate: key,
			valueExpr: getBlankNodeId(value),
		})
	}
	return {
		type: "EachOf",
		expressions: [anyType, { type: "OneOf", expressions }],
	}
}

export type CoproductResult = {
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
						expressions: [
							anyTypeResult,
							{
								type: "OneOfSolutions"
								solutions: [
									{ type: "OneOfSolution"; expressions: [OptionResult] }
								]
							}
						]
					}
				]
			}
		}
	]
}

export type OptionResult = {
	type: "TripleConstraintSolutions"
	predicate: string
	valueExpr: string
	productionLabel: string
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

export function isOptionResult(
	result: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions
): result is OptionResult {
	return (
		result.type === "TripleConstraintSolutions" &&
		result.solutions.length === 1 &&
		result.productionLabel !== undefined
	)
}

export function isCoproductResult(
	result: SuccessResult,
	id: string
): result is CoproductResult {
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
	if (expressions.length !== 2) {
		return false
	}
	const [first, oneOf] = expressions
	if (oneOf.type !== "OneOfSolutions") {
		return false
	} else if (oneOf.solutions.length !== 1) {
		return false
	}
	const [{ expressions: options }] = oneOf.solutions
	if (options.length !== 1) {
		return false
	}

	const [option] = options

	return (
		isBlankNodeConstraintResult(nodeConstraint) &&
		nodeConstraint.shape === blankNodeId &&
		isAnyTypeResult(first) &&
		isOptionResult(option)
	)
}

// lmao
export const parseCoproductResult = (result: CoproductResult) =>
	result.solutions[1].solution.solutions[0].expressions[1].solutions[0]
		.expressions[0]
