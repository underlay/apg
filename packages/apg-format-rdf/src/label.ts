import { Schema } from "@underlay/apg"
import { rdf } from "@underlay/namespaces"

import { SuccessResult } from "shex/packages/shex-validator"

import { getBlankNodeId } from "./utils.js"

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
	key: string,
	value: Schema.Type,
	typeCache: Map<Exclude<Schema.Type, Schema.Reference>, string>
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
			getBlankNodeId(value, typeCache),
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
	return object === key && predicate === rdf.type
}

export function parseLabelResult(result: LabelResult): SuccessResult {
	const [{}, nextResult] = result.solutions
	return nextResult
}
