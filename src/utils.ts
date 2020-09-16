import { NamedNode, BlankNode, Literal, rdf, xsd } from "n3.ts"

import ShExParser from "@shexjs/parser"
import {
	EachOfSolutions,
	OneOfSolutions,
	TripleConstraintSolutions,
	TestedTriple,
	SuccessResult,
} from "@shexjs/validator"

const xsdString = new NamedNode(xsd.string)
const rdfType = rdf.type

export const zip = <A, B>(
	a: Iterable<A>,
	b: Iterable<B>
): Iterable<[A, B]> => ({
	[Symbol.iterator]() {
		const iterA = a[Symbol.iterator]()
		const iterB = b[Symbol.iterator]()
		return {
			next() {
				const resultA = iterA.next()
				const resultB = iterB.next()
				return {
					value: [resultA.value, resultB.value],
					done: resultA.done || resultB.done,
				}
			},
		}
	},
})

export function parseObjectValue(object: ShExParser.objectValue) {
	if (typeof object === "string") {
		if (object.startsWith("_:")) {
			return new BlankNode(object.slice(2))
		} else {
			return new NamedNode(object)
		}
	} else {
		const datatype =
			object.type === undefined ? xsdString : new NamedNode(object.type)
		return new Literal(object.value, object.language || datatype)
	}
}

export interface anyType
	extends ShExParser.TripleConstraint<typeof rdfType, undefined> {
	min: 0
	max: -1
}

export const anyType: anyType = {
	type: "TripleConstraint",
	predicate: rdf.type,
	min: 0,
	max: -1,
}

export function isAnyType(
	tripleExpr: ShExParser.tripleExpr
): tripleExpr is anyType {
	return (
		typeof tripleExpr !== "string" &&
		tripleExpr.type === "TripleConstraint" &&
		tripleExpr.predicate === rdf.type &&
		tripleExpr.min === 0 &&
		tripleExpr.max === -1 &&
		tripleExpr.valueExpr === undefined
	)
}

export type anyTypeResult = {
	type: "TripleConstraintSolutions"
	predicate: typeof rdfType
	solutions: anyTypeTripleResult[]
}

export function isAnyTypeResult(
	solutions: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions
): solutions is anyTypeResult {
	return (
		solutions.type === "TripleConstraintSolutions" &&
		solutions.predicate === rdf.type &&
		solutions.solutions.every(isAnyTypeTripleResult)
	)
}

type anyTypeTripleResult = {
	type: "TestedTriple"
	subject: string
	predicate: typeof rdfType
	object: string
}

function isAnyTypeTripleResult(
	triple: TestedTriple
): triple is anyTypeTripleResult {
	return (
		triple.predicate === rdf.type &&
		triple.referenced === undefined &&
		typeof triple.object === "string"
	)
}

export type DatatypeConstraint = { type: "NodeConstraint"; datatype: string }
export const isDatatypeConstraint = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is DatatypeConstraint =>
	typeof shapeExpr !== "string" &&
	shapeExpr.type === "NodeConstraint" &&
	shapeExpr.hasOwnProperty("datatype")

export const isNodeConstraint = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is { type: "NodeConstraint"; nodeKind: "bnode" | "iri" } =>
	typeof shapeExpr !== "string" &&
	shapeExpr.type === "NodeConstraint" &&
	shapeExpr.hasOwnProperty("nodeKind")

export type BlankNodeConstraint = { type: "NodeConstraint"; nodeKind: "bnode" }
export const blankNodeConstraint: BlankNodeConstraint = {
	type: "NodeConstraint",
	nodeKind: "bnode",
}

export const isBlankNodeConstraint = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is BlankNodeConstraint =>
	isNodeConstraint(shapeExpr) && shapeExpr.nodeKind === "bnode"

export type BlankNodeConstraintResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: BlankNodeConstraint
}

export function isBlankNodeConstraintResult(
	result: SuccessResult
): result is BlankNodeConstraintResult {
	return (
		result.type === "NodeConstraintTest" &&
		isBlankNodeConstraint(result.shapeExpr)
	)
}

type baseNamedNodeConstraint = {
	type: "NodeConstraint"
	nodeKind: "iri"
}

type patternNamedNodeConstraint = {
	type: "NodeConstraint"
	nodeKind: "iri"
	pattern: string
	flags: string
}

export type NamedNodeConstraint =
	| baseNamedNodeConstraint
	| patternNamedNodeConstraint

export const isNamedNodeConstraint = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is NamedNodeConstraint =>
	isNodeConstraint(shapeExpr) && shapeExpr.nodeKind === "iri"

export const isPatternNamedNodeConstraint = (
	shapeExpr: NamedNodeConstraint
): shapeExpr is patternNamedNodeConstraint =>
	shapeExpr.hasOwnProperty("pattern")
