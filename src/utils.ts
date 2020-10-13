import { NamedNode, BlankNode, Literal, rdf, xsd } from "n3.ts"

import ShExParser from "@shexjs/parser"
import {
	EachOfSolutions,
	OneOfSolutions,
	TripleConstraintSolutions,
	TestedTriple,
	SuccessResult,
} from "@shexjs/validator"
import APG from "./apg.js"

const xsdString = new NamedNode(xsd.string)
const rdfType = rdf.type

export const sortKeys = (
	[{}, { key: a }]: [string, { key: string }],
	[{}, { key: b }]: [string, { key: string }]
) => (a < b ? -1 : b < a ? 1 : 0)

export function rotateTree(
	trees: APG.Record[],
	pivot: string
): Map<number, APG.Record[]> {
	const result: Map<number, APG.Record[]> = new Map()
	for (const tree of trees) {
		const { index } = tree.get(pivot) as APG.Pointer
		const trees = result.get(index)
		if (trees === undefined) {
			result.set(index, [tree])
		} else {
			trees.push(tree)
		}
	}
	return result
}

export const getBlankNodeId = (
	type: APG.Type,
	typeCache: Map<Exclude<APG.Type, APG.Reference>, string>
): string =>
	type.type === "reference" ? `_:l${type.value}` : typeCache.get(type)!

export function equal(a: APG.Type, b: APG.Type) {
	if (a === b) {
		return true
	} else if (a.type !== b.type) {
		return false
	} else if (a.type === "reference" && b.type === "reference") {
		return a.value === b.value
	} else if (a.type === "unit" && b.type === "unit") {
		return true
	} else if (a.type === "iri" && b.type === "iri") {
		return true
	} else if (a.type === "literal" && b.type === "literal") {
		return a.datatype === b.datatype
	} else if (a.type === "product" && b.type === "product") {
		if (a.components.length !== b.components.length) {
			return false
		}
		for (const [A, B] of zip(a.components, b.components)) {
			if (A.key !== B.key) {
				return false
			} else if (equal(A.value, B.value)) {
				continue
			} else {
				return false
			}
		}
		return true
	} else if (a.type === "coproduct" && b.type === "coproduct") {
		if (a.options.length !== b.options.length) {
			return false
		}
		for (const [A, B] of zip(a.options, b.options)) {
			if (A.key !== B.key) {
				return false
			} else if (equal(A.value, B.value)) {
				continue
			} else {
				return false
			}
		}
		return true
	} else {
		return false
	}
}

export const zip = <A, B>(
	a: Iterable<A>,
	b: Iterable<B>
): Iterable<[A, B, number]> => ({
	[Symbol.iterator]() {
		const iterA = a[Symbol.iterator]()
		const iterB = b[Symbol.iterator]()
		let i = 0
		return {
			next() {
				const resultA = iterA.next()
				const resultB = iterB.next()
				if (resultA.done || resultB.done) {
					return { done: true, value: undefined }
				} else {
					return {
						done: false,
						value: [resultA.value, resultB.value, i++],
					}
				}
			},
		}
	},
})

export const zip3 = <A, B, C>(
	a: Iterable<A>,
	b: Iterable<B>,
	c: Iterable<C>
): Iterable<[A, B, C, number]> => ({
	[Symbol.iterator]() {
		const iterA = a[Symbol.iterator]()
		const iterB = b[Symbol.iterator]()
		const iterC = c[Symbol.iterator]()
		let i = 0
		return {
			next() {
				const resultA = iterA.next()
				const resultB = iterB.next()
				const resultC = iterC.next()
				if (resultA.done || resultB.done || resultC.done) {
					return { done: true, value: undefined }
				} else {
					return {
						done: false,
						value: [resultA.value, resultB.value, resultC.value, i++],
					}
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

export function findCommonPrefixIndex(a: string, b: string): number {
	for (const [A, B, i] of zip(a, b)) {
		if (A !== B) {
			return i
		}
	}

	return Math.min(a.length, b.length)
}
