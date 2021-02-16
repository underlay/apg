import { rdf, xsd } from "@underlay/namespaces"

import { Schema, getKeys } from "@underlay/apg"

import { DataFactory } from "n3"

import ShExParser from "shex/packages/shex-parser"

import {
	EachOfSolutions,
	OneOfSolutions,
	TripleConstraintSolutions,
	TestedTriple,
	SuccessResult,
} from "shex/packages/shex-validator"

export function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error("Invalid type")
}

export const getBlankNodeId = (
	type: Schema.Type,
	typeCache: Map<Exclude<Schema.Type, Schema.Reference>, string>
): string =>
	type.type === "reference" ? `_:l${type.value}` : typeCache.get(type)!

export function parseObjectValue(object: ShExParser.objectValue) {
	if (typeof object === "string") {
		if (object.startsWith("_:")) {
			return DataFactory.blankNode(object.slice(2))
		} else {
			return DataFactory.namedNode(object)
		}
	} else if (object.language) {
		return DataFactory.literal(object.value, object.language)
	} else {
		return object.type === undefined || object.type === xsd.string
			? DataFactory.literal(object.value)
			: DataFactory.literal(object.value, DataFactory.namedNode(object.type))
	}
}

export interface anyType
	extends ShExParser.TripleConstraint<typeof rdf.type, undefined> {
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
	predicate: typeof rdf.type
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
	predicate: typeof rdf.type
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

export function getCaches(
	schema: Schema.Schema
): [
	Map<Exclude<Schema.Type, Schema.Reference>, string>,
	Map<string, string[]>
] {
	const typeCache: Map<
		Exclude<Schema.Type, Schema.Reference>,
		string
	> = new Map()
	const keyCache: Map<string, string[]> = new Map()
	getKeys(schema).reduce(
		(i, key) => cacheType(i, schema[key], typeCache, keyCache),
		0
	)

	return [typeCache, keyCache]
}

function cacheType(
	i: number,
	type: Schema.Type,
	typeCache: Map<Exclude<Schema.Type, Schema.Reference>, string>,
	keyCache: Map<string, readonly string[]>
): number {
	if (type.type === "reference") {
		return i
	} else if (typeCache.has(type)) {
		return i
	} else if (type.type === "uri") {
		if (!typeCache.has(type)) {
			typeCache.set(type, `_:t${i++}`)
		}
		return i
	} else if (type.type === "literal") {
		if (!typeCache.has(type)) {
			typeCache.set(type, `_:t${i++}`)
		}
		return i
	} else if (type.type === "product") {
		if (typeCache.has(type)) {
			return i
		}
		const id = `_:t${i++}`
		typeCache.set(type, id)
		const keys = getKeys(type.components)
		keyCache.set(id, keys)
		return keys.reduce(
			(i, key) => cacheType(i, type.components[key], typeCache, keyCache),
			i
		)
	} else if (type.type === "coproduct") {
		if (typeCache.has(type)) {
			return i
		}
		const id = `_:t${i++}`
		typeCache.set(type, id)
		const keys = getKeys(type.options)
		keyCache.set(id, keys)
		return keys.reduce(
			(i, key) => cacheType(i, type.options[key], typeCache, keyCache),
			i
		)
	} else {
		signalInvalidType(type)
	}
}
