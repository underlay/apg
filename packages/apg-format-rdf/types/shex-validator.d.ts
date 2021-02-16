declare module "shex/packages/shex-validator" {
	import {
		Schema,
		shapeExpr,
		objectValue,
		Annotation,
	} from "shex/packages/shex-parser"

	import * as ShExUtil from "shex/packages/shex-util"

	export type Start = { term: "START" }

	export default class Validator {
		static start: Start
		static construct(
			schema: Schema,
			db: ShExUtil.RdfJsDB,
			options?: { or?: string; partition?: string; results?: string }
		): Validator
		validate(id: string, start: shapeExpr): SuccessResult | FailureResult
	}

	export type SuccessResult =
		| ShapeAndResults
		| ShapeOrResults
		| ShapeNotResults
		| ShapeTest
		| NodeConstraintTest
		| Recursion

	export type FailureResult =
		| ShapeAndFailure
		| ShapeOrFailure
		| ShapeNotFailure
		| Failure

	export type ShapeAndFailure = {
		type: "ShapeAndFailure"
		errors: {}[]
	}

	export type ShapeOrFailure = {
		type: "ShapeOrFailure"
		errors: {}[]
	}

	export type ShapeNotFailure = {
		type: "ShapeNotFailure"
		errors: {}[]
	}

	export type Failure = {
		type: "Failure"
		shape: string
		node: string
		errors: {}[]
	}

	export type Recursion = {
		type: "Recursion"
		node: string
		shape: string
	}

	export type ShapeAndResults = {
		type: "ShapeAndResults"
		solutions: SuccessResult[]
	}

	export type ShapeOrResults = {
		type: "ShapeOrResults"
		solution: SuccessResult
	}

	export type ShapeNotResults = {
		type: "ShapeNotResult"
		solution: SuccessResult
	}

	export type NodeConstraintTest = {
		type: "NodeConstraintTest"
		node: string
		shape: string
		shapeExpr: shapeExpr
	}

	export type ShapeTest = {
		type: "ShapeTest"
		node: string
		shape: string
		solution: solutions
		annotations?: Annotation[]
	}

	type solutions = EachOfSolutions | OneOfSolutions | TripleConstraintSolutions

	export type EachOfSolutions = {
		type: "EachOfSolutions"
		solutions: EachOfSolution[]
		min?: number
		max?: number
		annotations?: Annotation[]
	}

	export type EachOfSolution = {
		type: "EachOfSolution"
		expressions: solutions[]
	}

	export type OneOfSolutions = {
		type: "OneOfSolutions"
		solutions: OneOfSolution[]
		min?: number
		max?: number
		annotations?: Annotation[]
	}

	export type OneOfSolution = {
		type: "OneOfSolution"
		expressions: solutions[]
	}

	export type TripleConstraintSolutions<O = objectValue> = {
		type: "TripleConstraintSolutions"
		predicate: string
		solutions: TestedTriple<O>[]
		valueExpr?: shapeExpr
		productionLabel?: string
		min?: number
		max?: number
		annotations?: Annotation[]
	}

	export type TestedTriple<O = objectValue> = {
		type: "TestedTriple"
		subject: string
		predicate: string
		object: O
		referenced?: SuccessResult
	}
}
