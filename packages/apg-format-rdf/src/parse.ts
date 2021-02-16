import { Option } from "fp-ts/Option"
import { Either } from "fp-ts/Either"

import RDF from "rdf-js"
import { DataFactory, Store } from "n3"

import { v4 as uuid } from "uuid"

import ShExUtil from "shex/packages/shex-util"
import ShExValidator, {
	SuccessResult,
	FailureResult,
} from "shex/packages/shex-validator"

import zip from "ziterable"

import { Schema, Instance, mapKeys, getKeys, getKeyIndex } from "@underlay/apg"
import { rdf } from "@underlay/namespaces"

import { makeShExSchema } from "./shexSchema.js"
import { isUriResult } from "./uri.js"
import { isLabelResult, parseLabelResult } from "./label.js"
import { isLiteralResult } from "./literal.js"
import { isProductResult, parseProductResult } from "./product.js"
import { isCoproductResult, parseCoproductResult } from "./coproduct.js"

import {
	parseObjectValue,
	getBlankNodeId,
	signalInvalidType,
	getCaches,
} from "./utils.js"

type Token = { node: RDF.Quad_Object; shape: string; used: boolean }

type State = Readonly<{
	schema: Schema.Schema
	typeCache: Map<Exclude<Schema.Type, Schema.Reference>, string>
	instance: Instance.Instance
	elementCache: { [k in string]: Map<string, number> }
	keyCache: Map<string, string[]>
	stack: Token[]
}>

const rdfType = DataFactory.namedNode(rdf.type)

export function parseString(
	input: string,
	schema: Schema.Schema
): Either<FailureResult, Instance.Instance> {
	const store = new Store(Parse(input))
	return parse(store, schema)
}

export function parse(
	store: Store,
	schema: Schema.Schema
): Either<FailureResult, Instance.Instance> {
	const db = ShExUtil.rdfjsDB(store)

	const [typeCache, keyCache] = getCaches(schema)
	const shexSchema = makeShExSchema(typeCache, schema)
	const validator = ShExValidator.construct(shexSchema, db, {})
	const state: State = Object.freeze({
		schema,
		typeCache,
		instance: mapKeys(schema, () => []),
		elementCache: mapKeys(schema, () => new Map<string, number>()),
		keyCache,
		stack: [],
	})

	for (const [index, key] of getKeys(schema).entries()) {
		const cache = state.elementCache[key]

		const shape = `_:l${index}`
		const object = DataFactory.namedNode(key)
		const subjects = store.getSubjects(rdfType, object, null)
		for (const subject of subjects) {
			if (subject.termType === "BlankNode") {
				if (cache.has(subject.value)) {
					continue
				}

				const result = validator.validate(subject.id, shape)
				if (isFailure(result)) {
					return { _tag: "Left", left: result }
				}

				// This reference is "synthetic" - just a way to parse a root
				// label by pretending that we're starting with a reference to it.
				const reference = Schema.reference(key)

				// match is an Option<Pointer> that we won't actually use
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
	type: Schema.Type,
	node: RDF.NamedNode | RDF.BlankNode | RDF.Literal,
	result: SuccessResult,
	state: State
): Option<Instance.Value> {
	// References are never cached
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
	key: string,
	node: RDF.NamedNode | RDF.BlankNode | RDF.Literal,
	result: SuccessResult,
	state: State
): Option<Instance.Value> {
	const index = getKeyIndex(state.schema, key)
	const id = `_:l${index}`
	if (isLabelResult(result, id, key)) {
		if (node.termType === "BlankNode") {
			const cache = state.elementCache[key].get(node.value)
			if (cache !== undefined) {
				return { _tag: "Some", value: Instance.reference(cache) }
			}

			const nextResult = parseLabelResult(result)
			const l = state.stack.length
			const token = { node, shape: id, used: false }
			state.stack.push(token)
			const match = parseResult(state.schema[key], node, nextResult, state)
			state.stack.pop()
			if (match._tag === "None") {
				return match
			} else {
				const reference = state.instance[key].length
				const value = token.used
					? replaceTokenValue(
							Instance.reference(reference),
							match.value,
							`urn:uuid:${tokenRoot}#${l}`
					  )
					: match.value

				state.instance[key].push(value)
				state.elementCache[key].set(node.value, reference)
				return { _tag: "Some", value: Instance.reference(reference) }
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
			const value = Instance.uri(`urn:uuid:${tokenRoot}#${index}`)
			return { _tag: "Some", value: value }
		}
	} else {
		return { _tag: "None" }
	}
}

function replaceTokenValue(
	pointer: Instance.Reference,
	value: Instance.Value,
	uri: string
): Instance.Value {
	if (value.type === "product") {
		return Instance.product(
			value.components,
			value.map((value) => replaceTokenValue(pointer, value, uri))
		)
	} else if (value.type === "coproduct") {
		return Instance.coproduct(
			value.options,
			value.key,
			replaceTokenValue(pointer, value.value, uri)
		)
	} else if (value.type === "uri" && value.value === uri) {
		return pointer
	} else {
		return value
	}
}

function parseTypeResult(
	id: string,
	type: Exclude<Schema.Type, Schema.Reference>,
	node: RDF.NamedNode | RDF.BlankNode | RDF.Literal,
	result: SuccessResult,
	state: State
): Option<Instance.Value> {
	if (type.type === "literal") {
		if (isLiteralResult(result, id)) {
			if (node.termType === "Literal") {
				return {
					_tag: "Some",
					value: Instance.literal(
						node.value,
						Instance.uri(node.datatype.value)
					),
				}
			} else {
				throw new Error("Invalid result for literal type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "uri") {
		if (isUriResult(result, id)) {
			if (node.termType === "NamedNode") {
				return { _tag: "Some", value: Instance.uri(node.value) }
			} else {
				throw new Error("Invalid result for iri type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "product") {
		if (isProductResult(result, id)) {
			if (node.termType === "BlankNode") {
				const solutions = parseProductResult(result)

				if (getKeys(type.components).length !== solutions.length) {
					throw new Error("Invalid product result")
				}

				const componentKeys = state.keyCache.get(id)
				if (componentKeys === undefined) {
					throw new Error(`Could not find keys for product ${id}`)
				}

				const components: Instance.Value[] = new Array(solutions.length)

				const iter = zip(getKeys(type.components), solutions)
				for (const [key, solution, index] of iter) {
					const component = type.components[key]
					const componentId = `${id}-c${index}`
					if (componentId !== solution.productionLabel) {
						throw new Error("Invalid component result")
					}

					const {
						valueExpr,
						solutions: [{ object: objectValue, referenced: ref }],
					} = solution
					const object = parseObjectValue(objectValue)

					const componentValueId = getBlankNodeId(component, state.typeCache)
					if (ref !== undefined && valueExpr === componentValueId) {
						const match = parseResult(component, object, ref, state)
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
					value: Instance.product(componentKeys, components),
				}
			} else {
				throw new Error("Invalid result for product type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "coproduct") {
		if (isCoproductResult(result, id)) {
			if (node.termType === "BlankNode") {
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
				if (isNaN(index) || index >= getKeys(type.options).length) {
					throw new Error(`Invalid option id ${optionId}`)
				}
				const option = type.options[index]

				const {
					valueExpr,
					solutions: [{ object: objectValue, referenced: ref }],
				} = optionResult
				const object = parseObjectValue(objectValue)

				const optionValueId = getBlankNodeId(option, state.typeCache)
				if (ref !== undefined && valueExpr === optionValueId) {
					const match = parseResult(option, object, ref, state)
					if (match._tag === "None") {
						return match
					} else {
						const value = Instance.coproduct(optionKeys, index, match.value)
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
