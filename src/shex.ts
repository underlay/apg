import { NamedNode, BlankNode, Store, Literal, D, Object, rdf } from "n3.ts"

import { Option } from "fp-ts/Option"
import { Either } from "fp-ts/Either"

import { v4 as uuid } from "uuid"

import ShExParser from "@shexjs/parser"
import ShExUtil from "@shexjs/util"
import ShExValidator, { SuccessResult, FailureResult } from "@shexjs/validator"

import APG from "./apg.js"
import {
	zip,
	parseObjectValue,
	getBlankNodeId,
	signalInvalidType,
} from "./utils.js"
import { isUnitResult, makeUnitShape } from "./unit.js"
import { isIriResult, makeIriShape } from "./iri.js"
import { isLabelResult, parseLabelResult, makeLabelShape } from "./label.js"
import { isLiteralResult, makeLiteralShape } from "./literal.js"
import {
	isProductResult,
	parseProductResult,
	makeProductShape,
} from "./product.js"
import {
	isCoproductResult,
	makeCoproductShape,
	parseCoproductResult,
} from "./coproduct.js"

type Token = {
	node: Object<D>
	shape: string
	used: boolean
}

type State = Readonly<{
	schema: APG.Schema
	typeCache: Map<Exclude<APG.Type, APG.Reference>, string>
	instance: APG.Instance
	valueCache: Array<Map<string, number>>
	keyCache: Map<string, string[]>
	stack: Token[]
}>

const rdfType = new NamedNode(rdf.type)

export function parse(
	store: Store,
	schema: APG.Schema
): Either<FailureResult, APG.Instance> {
	const db = ShExUtil.makeN3DB(store)
	const typeCache: Map<Exclude<APG.Type, APG.Reference>, string> = new Map()
	const keyCache: Map<string, string[]> = new Map()
	schema.reduce((i, { value }) => cacheType(i, value, typeCache, keyCache), 0)
	const shexSchema = makeShExSchema(typeCache, schema)
	const validator = ShExValidator.construct(shexSchema, {})
	const state: State = Object.freeze({
		schema,
		typeCache,
		instance: new Array(schema.length).fill(null).map(() => []),
		valueCache: new Array(schema.length).fill(null).map(() => new Map()),
		keyCache,
		stack: [],
	})

	for (const [label, cache, index] of zip(schema, state.valueCache)) {
		const shape = `_:l${index}`
		const subjects = store.subjects(rdfType, new NamedNode(label.key), null)
		for (const subject of subjects) {
			if (subject instanceof BlankNode) {
				if (cache.has(subject.value)) {
					continue
				}

				const result = validator.validate(db, subject.id, shape)
				if (isFailure(result)) {
					return { _tag: "Left", left: result }
				}

				const reference: APG.Reference = Object.freeze({
					type: "reference",
					value: index,
				})

				const match = parseResult(reference, subject, result, state)

				if (match._tag === "None") {
					const errors = [
						{ message: "Subject failed parsing", node: subject.id, shape },
					]
					return {
						_tag: "Left",
						left: { type: "Failure", shape, node: subject.id, errors },
					}
				}

				// cache.set(subject.value, values.push(match.value) - 1)
			} else {
				return {
					_tag: "Left",
					left: { type: "Failure", shape, node: subject.id, errors: [] },
				}
			}
		}
	}

	return { _tag: "Right", right: state.instance }
}

function makeShExSchema(
	typeCache: Map<Exclude<APG.Type, APG.Reference>, string>,
	schema: APG.Schema
): ShExParser.Schema {
	const shapes: ({ id: string } & ShExParser.shapeExprObject)[] = []

	for (const [type, id] of typeCache) {
		shapes.push(makeShapeExpr(id, type, typeCache))
	}

	for (const [index, label] of schema.entries()) {
		shapes.push(makeLabelShape(`_:l${index}`, label, typeCache))
	}

	return { type: "Schema", shapes }
}

function cacheType(
	i: number,
	type: APG.Type,
	typeCache: Map<Exclude<APG.Type, APG.Reference>, string>,
	keyCache: Map<string, string[]>
): number {
	if (type.type === "reference") {
		return i
	} else if (typeCache.has(type)) {
		return i
	} else if (type.type === "unit") {
		if (!typeCache.has(type)) {
			typeCache.set(type, `_:t${i++}`)
		}
		return i
	} else if (type.type === "iri") {
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
		const keys = type.components.map(({ key }) => key).sort()
		Object.freeze(keys)
		keyCache.set(id, keys)
		return type.components.reduce(
			(i, { value }) => cacheType(i, value, typeCache, keyCache),
			i
		)
	} else if (type.type === "coproduct") {
		if (typeCache.has(type)) {
			return i
		}
		const id = `_:t${i++}`
		typeCache.set(type, id)
		const keys = type.options.map(({ key }) => key).sort()
		Object.freeze(keys)
		keyCache.set(id, keys)
		return type.options.reduce(
			(i, { value }) => cacheType(i, value, typeCache, keyCache),
			i
		)
	} else {
		signalInvalidType(type)
	}
}

function makeShapeExpr(
	id: string,
	type: Exclude<APG.Type, APG.Reference>,
	typeCache: Map<Exclude<APG.Type, APG.Reference>, string>
): { id: string } & ShExParser.shapeExprObject {
	if (type.type === "unit") {
		return makeUnitShape(id, type)
	} else if (type.type === "iri") {
		return makeIriShape(id, type)
	} else if (type.type === "literal") {
		return makeLiteralShape(id, type)
	} else if (type.type === "product") {
		return makeProductShape(id, type, typeCache)
	} else if (type.type === "coproduct") {
		return makeCoproductShape(id, type, typeCache)
	} else {
		signalInvalidType(type)
	}
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
	type: APG.Type,
	node: NamedNode<string> | BlankNode | Literal,
	result: SuccessResult,
	state: State
): Option<APG.Value> {
	if (type.type === "reference") {
		return parseReferenceResult(type.value, node, result, state)
	} else {
		const id = state.typeCache.get(type)
		if (id === undefined) {
			throw new Error("No id for type")
		}
		return parseTypeResult(id, type, node, result, state)
	}
}

const tokenRoot = uuid()

function parseReferenceResult(
	index: number,
	node: NamedNode<string> | BlankNode | Literal,
	result: SuccessResult,
	state: State
): Option<APG.Value> {
	const id = `_:l${index}`
	const label = state.schema[index]
	if (isLabelResult(result, id, label.key)) {
		if (node instanceof BlankNode) {
			const cache = state.valueCache[index].get(node.value)
			if (cache !== undefined) {
				return { _tag: "Some", value: new APG.Pointer(cache) }
			}

			const nextResult = parseLabelResult(result)
			const l = state.stack.length
			const token = { node, shape: id, used: false }
			state.stack.push(token)
			const match = parseResult(label.value, node, nextResult, state)
			state.stack.pop()
			if (match._tag === "None") {
				return match
			} else {
				const pointer = state.instance[index].length
				const value = token.used
					? replaceTokenValue(
							pointer,
							match.value,
							`urn:uuid:${tokenRoot}#${l}`
					  )
					: match.value

				state.instance[index].push(value)
				state.valueCache[index].set(node.value, pointer)
				return { _tag: "Some", value: new APG.Pointer(pointer) }
			}
		} else {
			throw new Error("Invalid result for reference type")
		}
	} else if (result.type === "Recursion" && result.shape === id) {
		const index = state.stack.findIndex(
			(token) => node.equals(token.node) && token.shape === id
		)
		if (index === -1) {
			throw new Error("Unexpected recursion result")
		} else {
			state.stack[index].used = true
			const value = new NamedNode(`urn:uuid:${tokenRoot}#${index}`)
			return { _tag: "Some", value: value }
		}
	} else {
		return { _tag: "None" }
	}
}

function replaceTokenValue(
	pointer: number,
	value: APG.Value,
	uri: string
): APG.Value {
	if (value.termType === "Record") {
		return new APG.Record(
			value.node,
			value.componentKeys,
			Array.from(replaceLeaves(pointer, value, uri))
		)
	} else if (value.termType === "Variant") {
		return new APG.Variant(
			value.node,
			value.optionKeys,
			value.index,
			replaceTokenValue(pointer, value.value, uri)
		)
	} else if (value.termType === "NamedNode" && value.value === uri) {
		return new APG.Pointer(pointer)
	} else {
		return value
	}
}

function* replaceLeaves(
	pointer: number,
	product: APG.Record,
	uri: string
): Iterable<APG.Value> {
	for (const leaf of product) {
		yield replaceTokenValue(pointer, leaf, uri)
	}
}

function parseTypeResult(
	id: string,
	type: Exclude<APG.Type, APG.Reference>,
	node: NamedNode<string> | BlankNode | Literal,
	result: SuccessResult,
	state: State
): Option<APG.Value> {
	if (type.type === "unit") {
		if (isUnitResult(result, id)) {
			if (node instanceof BlankNode) {
				return { _tag: "Some", value: node }
			} else {
				throw new Error("Invalid result for unit type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "literal") {
		if (isLiteralResult(result, id)) {
			if (node instanceof Literal) {
				return { _tag: "Some", value: node }
			} else {
				throw new Error("Invalid result for literal type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "iri") {
		if (isIriResult(result, id)) {
			if (node instanceof NamedNode) {
				return { _tag: "Some", value: node }
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

				if (type.components.length !== solutions.length) {
					throw new Error("Invalid product result")
				}

				const componentKeys = state.keyCache.get(id)
				if (componentKeys === undefined) {
					throw new Error(`Could not find keys for product ${id}`)
				}

				const components: APG.Value[] = new Array(solutions.length)

				const iter = zip(type.components, solutions)
				for (const [component, solution, index] of iter) {
					const componentId = `${id}-c${index}`
					if (componentId !== solution.productionLabel) {
						throw new Error("Invalid component result")
					}

					const {
						valueExpr,
						solutions: [{ object: objectValue, referenced: ref }],
					} = solution
					const object = parseObjectValue(objectValue)

					const componentValueId = getBlankNodeId(
						component.value,
						state.typeCache
					)
					if (ref !== undefined && valueExpr === componentValueId) {
						const match = parseResult(component.value, object, ref, state)
						if (match._tag === "None") {
							return match
						} else {
							components[index] = match.value
						}
					} else {
						throw new Error("Invalid component result")
					}
				}
				return {
					_tag: "Some",
					value: new APG.Record(node, componentKeys, components),
				}
			} else {
				throw new Error("Invalid result for product type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "coproduct") {
		if (isCoproductResult(result, id)) {
			if (node instanceof BlankNode) {
				const optionKeys = state.keyCache.get(id)
				if (optionKeys === undefined) {
					throw new Error(`Could not find keys for coproduct ${id}`)
				}
				const optionResult = parseCoproductResult(result)
				const optionId = optionResult.productionLabel
				if (!optionId.startsWith(id)) {
					throw new Error(`Invalid option id ${optionId}`)
				}
				const tail = optionId.slice(id.length)
				const tailMatch = optionIdTailPattern.exec(tail)
				if (tailMatch === null) {
					throw new Error(`Invalid option id ${optionId}`)
				}
				const [{}, indexId] = tailMatch
				const index = parseInt(indexId)
				if (isNaN(index) || index >= type.options.length) {
					throw new Error(`Invalid option id ${optionId}`)
				}
				const option = type.options[index]

				const {
					valueExpr,
					solutions: [{ object: objectValue, referenced: ref }],
				} = optionResult
				const object = parseObjectValue(objectValue)

				const optionValueId = getBlankNodeId(option.value, state.typeCache)
				if (ref !== undefined && valueExpr === optionValueId) {
					const match = parseResult(option.value, object, ref, state)
					if (match._tag === "None") {
						return match
					} else {
						const value = new APG.Variant(node, optionKeys, index, match.value)
						return { _tag: "Some", value }
					}
				} else {
					throw new Error("Invalid option result")
				}
			} else {
				throw new Error("Invalid result for coproduct type")
			}
		} else {
			return { _tag: "None" }
		}
	} else {
		signalInvalidType(type)
	}
}

const optionIdTailPattern = /^-o(\d+)$/
