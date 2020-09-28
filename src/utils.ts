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

export function pivotTree<V extends T, T extends APG.Value = APG.Value>(
	trees: Set<APG.Tree<T>>,
	key: string
): Map<V, Set<APG.Tree<T>>> {
	const pivot: Map<V, Set<APG.Tree<T>>> = new Map()
	for (const tree of trees) {
		const value = tree.get(key) as V
		if (value === undefined) {
			throw new Error("Pivot failure")
		} else {
			const trees = pivot.get(value)
			if (trees === undefined) {
				pivot.set(value, new Set([tree]))
			} else {
				trees.add(tree)
			}
		}
	}
	return pivot
}

export const getBlankNodeId = (a: string | APG.Reference): string =>
	typeof a === "string" ? `_:${a}` : `_:${a.value}`

export const equal = (a: string | APG.Reference, b: string | APG.Reference) =>
	(typeof a === "string" && typeof b === "string" && a === b) ||
	(typeof a !== "string" && typeof b !== "string" && a.value === b.value)

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
