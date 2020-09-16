import { rdf } from "n3.ts"

import ShExParser from "@shexjs/parser"
import { SuccessResult } from "@shexjs/validator"

import { APG } from "./schema.js"

export type LabelShape = {
	id: string
	type: "ShapeAnd"
	shapeExprs: [
		{
			type: "Shape"
			extra: ["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]
			expression: {
				type: "TripleConstraint"
				predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
				valueExpr: {
					type: "NodeConstraint"
					values: [string]
				}
			}
		},
		ShExParser.shapeExpr
	]
}

export function makeLabelShape(
	type: APG.Label,
	value: ShExParser.shapeExpr
): LabelShape {
	return {
		id: type.id,
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
						values: [type.key],
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

export function isLabelResult(result: SuccessResult): result is LabelResult {
	if (result.type !== "ShapeAndResults") {
		return false
	} else if (result.solutions.length !== 2) {
		return false
	}
	const [shape] = result.solutions
	if (shape.type !== "ShapeTest") {
		return false
	} else if (shape.solution.type !== "TripleConstraintSolutions") {
		return false
	} else if (shape.solution.predicate !== rdf.type) {
		return false
	} else if (shape.solution.solutions.length !== 1) {
		return false
	}
	const [{ object, predicate }] = shape.solution.solutions
	return predicate === rdf.type && typeof object === "string"
}

export function parseLabelResult(
	result: LabelResult
): [string, string, SuccessResult] {
	const [{ solution, shape }, nextResult] = result.solutions
	const [{ object }] = solution.solutions
	return [object, shape, nextResult]
}
