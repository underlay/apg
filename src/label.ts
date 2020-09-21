import { rdf } from "n3.ts"

import { SuccessResult } from "@shexjs/validator"

import { APG } from "./apg.js"

export type LabelShape = {
	id: string
	type: "ShapeAnd"
	shapeExprs: [
		{
			type: "Shape"
			extra: [typeof rdf.type]
			expression: {
				type: "TripleConstraint"
				predicate: typeof rdf.type
				valueExpr: {
					type: "NodeConstraint"
					values: [string]
				}
			}
		},
		string
	]
}

export function makeLabelShape(
	id: string,
	{ key, value }: APG.Label
): LabelShape {
	return {
		id: id,
		type: "ShapeAnd",
		shapeExprs: [
			{
				type: "Shape",
				extra: [rdf.type],
				expression: {
					type: "TripleConstraint",
					predicate: rdf.type,
					valueExpr: {
						type: "NodeConstraint",
						values: [key],
					},
				},
			},
			value,
		],
	}
}

export type LabelResult = {
	type: "ShapeAndResults"
	solutions: [
		{
			type: "ShapeTest"
			node: string
			shape: string
			solution: {
				type: "TripleConstraintSolutions"
				predicate: typeof rdf.type
				solutions: [
					{
						type: "TestedTriple"
						subject: string
						predicate: typeof rdf.type
						object: string
					}
				]
			}
		},
		SuccessResult
	]
}

export function isLabelResult(
	result: SuccessResult,
	id: string,
	key: string
): result is LabelResult {
	if (result.type !== "ShapeAndResults") {
		return false
	} else if (result.solutions.length !== 2) {
		return false
	}
	const [shape] = result.solutions
	if (shape.type !== "ShapeTest") {
		return false
	} else if (shape.shape !== id) {
		return false
	} else if (shape.solution.type !== "TripleConstraintSolutions") {
		return false
	} else if (shape.solution.predicate !== rdf.type) {
		return false
	} else if (shape.solution.solutions.length !== 1) {
		return false
	}
	const [{ object, predicate }] = shape.solution.solutions
	return predicate === rdf.type && object === key
}

export function parseLabelResult(result: LabelResult): SuccessResult {
	const [{}, nextResult] = result.solutions
	return nextResult
}
