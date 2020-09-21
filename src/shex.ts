import { NamedNode, BlankNode, Store, Literal, D, Object, rdf } from "n3.ts"

import { Option } from "fp-ts/Option"
import { Either } from "fp-ts/Either"

import ShExParser from "@shexjs/parser"
import ShExUtil from "@shexjs/util"
import ShExValidator, { SuccessResult, FailureResult } from "@shexjs/validator"

import { APG } from "./apg.js"
import { zip, parseObjectValue } from "./utils.js"
import { isUnitResult, makeUnitShape } from "./unit.js"
import { isIriResult, makeIriShape } from "./iri.js"
import { isLabelResult, parseLabelResult, makeLabelShape } from "./label.js"
import { isLiteralResult, makeLiteralShape } from "./literal.js"
import {
	isProductResult,
	parseProductResult,
	makeProductShape,
} from "./product.js"
import { makeCoproductShape } from "./coproduct.js"

type ShapeMap = Map<string, { id: string } & ShExParser.shapeExprObject>
type Token = Readonly<{ node: Object<D>; shape: string; value: APG.Value }>
type State = Readonly<{
	schema: APG.Schema
	shapeMap: ShapeMap
	stack: Token[]
	cache: Map<string, APG.Value>
}>

const rdfType = new NamedNode(rdf.type)

export function parse(
	store: Store,
	schema: APG.Schema
): Either<FailureResult, APG.Instance> {
	const database: APG.Instance = new Map()
	const db = ShExUtil.makeN3DB(store)
	const [shapeMap, shexSchema] = makeShExSchema(schema)
	// console.log("ShEx Schema")
	// console.log(JSON.stringify(shexSchema, null, "  "))
	const state = Object.freeze({ schema, shapeMap, stack: [], cache: new Map() })
	const validator = ShExValidator.construct(shexSchema, {})

	for (const type of schema.values()) {
		if (type.type === "label") {
			const values = parseLabel(type, state, store, db, validator)
			if (values._tag === "Left") {
				return values
			} else {
				database.set(type.id, values.right)
			}
		}
	}

	return { _tag: "Right", right: database }
}

function parseLabel(
	{ id, key }: APG.Label,
	state: State,
	store: Store,
	db: ShExUtil.N3DB,
	validator: ShExValidator
): Either<FailureResult, APG.Value[]> {
	const values: APG.Value[] = []
	for (const subject of store.subjects(rdfType, `<${key}>`, null)) {
		if (subject instanceof BlankNode || subject instanceof NamedNode) {
			const key = `${id} ${subject.value}`
			const cache = state.cache.get(key)
			if (cache !== undefined) {
				values.push(cache)
				continue
			}
			// console.log("validating", subject.id, id)
			const result = validator.validate(db, subject.id, id)
			if (isFailure(result)) {
				return { _tag: "Left", left: result }
			}

			const match = parseResult(subject as Object<D>, id, result, state)
			if (match._tag === "None") {
				const errors = [
					{ message: "Subject failed parsing", node: subject.id, shape: id },
				]
				return {
					_tag: "Left",
					left: { type: "Failure", shape: id, node: subject.id, errors },
				}
			}

			values.push(match.value)
		}
	}

	return { _tag: "Right", right: values }
}

function makeShExSchema(schema: APG.Schema): [ShapeMap, ShExParser.Schema] {
	const shapeMap: ShapeMap = new Map()
	for (const [id, type] of schema) {
		const shapeExpr = makeShapeExpr(id, type)
		shapeMap.set(id, shapeExpr)
	}
	const shexSchema: ShExParser.Schema = {
		type: "Schema",
		shapes: Array.from(shapeMap.values()),
	}
	return [shapeMap, shexSchema]
}

function makeShapeExpr(
	id: string,
	type: APG.Type
): { id: string } & ShExParser.shapeExprObject {
	if (type.type === "label") {
		return makeLabelShape(id, type)
	} else if (type.type === "unit") {
		return makeUnitShape(id, type)
	} else if (type.type === "iri") {
		return makeIriShape(id, type)
	} else if (type.type === "literal") {
		return makeLiteralShape(id, type)
	} else if (type.type === "product") {
		return makeProductShape(id, type)
	} else if (type.type === "coproduct") {
		return makeCoproductShape(id, type)
	} else {
		signalInvalidType(id, type)
	}
}

function signalInvalidType(id: string, type: never): never {
	console.error(type)
	throw new Error(`Invalid type: ${id} ${type}`)
}

function isFailure(
	result: SuccessResult | FailureResult
): result is FailureResult {
	return (
		result.type === "Failure" ||
		result.type === "ShapeAndFailure" ||
		result.type === "ShapeOrFailure" ||
		result.type === "ShapeNotFailure"
	)
}

function parseResult(
	node: Object<D>,
	id: string,
	result: SuccessResult,
	state: State
): Option<APG.Value> {
	// console.log("parsing shape", id)
	const type = state.schema.get(id)
	// console.log(node, type)
	// console.log(JSON.stringify(result, null, "  "))
	if (type === undefined) {
		throw new Error(`No type with id ${id} exists`)
	} else if (type.type === "label") {
		if (isLabelResult(result, type.id, type.key)) {
			if (node instanceof BlankNode || node instanceof NamedNode) {
				const cache = state.cache.get(`${type.value} ${node.value}`)
				if (cache !== undefined) {
					const key = `${id} ${node.value}`
					const value: APG.Value = { id, type: "label", value: cache }
					state.cache.set(key, value)
					return { _tag: "Some", value: value }
				}
			}
			const nextResult = parseLabelResult(result)
			const value: any = { id, type: "label", value: null }
			state.stack.push({ node, shape: id, value: value })
			const match = parseResult(node, type.value, nextResult, state)
			state.stack.pop()
			if (match._tag === "None") {
				return match
			} else {
				value.value = match.value
				if (node instanceof BlankNode || node instanceof NamedNode) {
					const key = `${id} ${node.value}`
					state.cache.set(key, value)
				}
				return { _tag: "Some", value: value as APG.Value }
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "unit") {
		if (isUnitResult(result, type.id)) {
			if (node instanceof BlankNode) {
				const key = `${id} ${node.value}`
				const value: APG.Value = { id, type: "unit", node }
				state.cache.set(key, value)
				return { _tag: "Some", value }
			} else {
				throw new Error("Invalid result for unit type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "literal") {
		if (isLiteralResult(result, id)) {
			if (node instanceof Literal) {
				const value: APG.Value = { id, type: "literal", node }
				return { _tag: "Some", value }
			} else {
				throw new Error("Invalid result for literal type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "iri") {
		if (isIriResult(result, id)) {
			if (node instanceof NamedNode) {
				const key = `${id} ${node.value}`
				const value: APG.Value = { id, type: "iri", node }
				state.cache.set(key, value)
				return { _tag: "Some", value }
			} else {
				throw new Error("Invalid result for iri type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "product") {
		if (isProductResult(result, id)) {
			if (node instanceof BlankNode) {
				const solutions = parseProductResult(result)
				const components = new Array(type.components.length)
				const value: APG.Value = { id, type: "product", node, components }
				state.stack.push({ node, shape: id, value })
				const iter = zip(type.components, solutions)
				for (const [component, solution, i] of iter) {
					const {
						valueExpr,
						solutions: [{ object: objectValue, referenced: ref }],
					} = solution
					// console.log("parsing component", component.key, component.value)
					const object = parseObjectValue(objectValue)
					if (object instanceof NamedNode || object instanceof BlankNode) {
						const cache = state.cache.get(`${id} ${object.value}`)
						if (cache !== undefined) {
							value.components[i] = cache
							continue
						}
					}
					if (ref !== undefined && valueExpr === component.value) {
						const match = parseResult(object, component.value, ref, state)
						if (match._tag === "None") {
							state.stack.pop()
							return match
						} else {
							value.components[i] = match.value
						}
					} else {
						throw new Error("Invalid TripleConstraintSolutions result")
					}
				}
				state.stack.pop()
				const key = `${id} ${node.value}`
				state.cache.set(key, value)
				return { _tag: "Some", value }
			} else {
				throw new Error("Invalid result for product type")
			}
		} else if (
			result.type === "Recursion" &&
			result.node === node.id &&
			result.shape === id
		) {
			// console.log("searching for recursion token")
			const token = state.stack.find(
				({ node, shape }) => node === node && shape === id
			)
			if (token !== undefined) {
				// console.log("found recursion token", token)
				return { _tag: "Some", value: token.value }
			} else {
				throw new Error("Could not locate recursion token")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "coproduct") {
		// Okay so the approach here is to traverse the *type* as a tree of nested coproducts
		// For each "leaf" (ie every non-coproduct), we check to see if result.solution is
		// a result for that leaf type.
		if (result.type === "ShapeOrResults") {
			for (const option of type.options) {
				if (isIriResult(result.solution, option.value)) {
					if (
						result.solution.shape === option.value &&
						node instanceof NamedNode
					) {
						const value: APG.Value = {
							id,
							type: "coproduct",
							value: { id: option.value, type: "iri", node },
						}
						const key = `${id} ${node.value}`
						state.cache.set(key, value)
						return { _tag: "Some", value: value }
					}
				} else if (
					isLiteralResult(result.solution, option.value) &&
					node instanceof Literal
				) {
					const value: APG.Value = {
						id,
						type: "coproduct",
						value: { id: option.value, type: "literal", node },
					}
					return { _tag: "Some", value: value }
				} else {
					if (node instanceof NamedNode || node instanceof BlankNode) {
						const cache = state.cache.get(`${option.value} ${node.value}`)
						if (cache !== undefined) {
							const value: APG.Value = {
								id,
								type: "coproduct",
								value: cache,
							}
							const key = `${id} ${node.value}`
							state.cache.set(key, value)
							return { _tag: "Some", value: value }
						}
					}
					const match = parseResult(node, option.value, result.solution, state)
					if (match._tag === "Some") {
						const value: APG.Value = {
							id,
							type: "coproduct",
							value: match.value,
						}
						if (node instanceof BlankNode || node instanceof NamedNode) {
							const key = `${id} ${node.value}`
							state.cache.set(key, value)
						}
						return { _tag: "Some", value: value }
					}
				}
			}
			return { _tag: "None" }
		} else {
			return { _tag: "None" }
		}
	} else {
		signalInvalidType(id, type)
	}
}
