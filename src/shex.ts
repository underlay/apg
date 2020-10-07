import { NamedNode, BlankNode, Store, Literal, D, Object, rdf } from "n3.ts"

import { Option } from "fp-ts/Option"
import { Either } from "fp-ts/Either"

import { v4 as uuid } from "uuid"

import ShExParser from "@shexjs/parser"
import ShExUtil from "@shexjs/util"
import ShExValidator, { SuccessResult, FailureResult } from "@shexjs/validator"

import APG from "./apg.js"
import { zip, parseObjectValue, getBlankNodeId } from "./utils.js"
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
	const shexSchema = makeShExSchema(schema)
	const validator = ShExValidator.construct(shexSchema, {})

	const state: State = Object.freeze({ schema, stack: [], cache: new Map() })
	for (const [id, label] of schema.labels) {
		const values: Set<APG.Value> = new Set()
		const subjects = store.subjects(rdfType, new NamedNode(label.key), null)
		for (const subject of subjects) {
			if (subject instanceof BlankNode) {
				const key = `${id}\t${subject.value}`
				const cache = state.cache.get(key)
				if (cache !== undefined) {
					values.add(cache)
					continue
				}
				const result = validator.validate(db, subject.id, getBlankNodeId(id))
				if (isFailure(result)) {
					return { _tag: "Left", left: result }
				}

				const match = parseResult(
					subject,
					{ type: "reference", value: id },
					result,
					state
				)
				if (match._tag === "None") {
					const errors = [
						{ message: "Subject failed parsing", node: subject.id, shape: id },
					]
					return {
						_tag: "Left",
						left: { type: "Failure", shape: id, node: subject.id, errors },
					}
				}

				values.add(match.value)
			}
		}

		database.set(id, values)
	}

	return { _tag: "Right", right: database }
}

function makeShExSchema(schema: APG.Schema): ShExParser.Schema {
	const shapes: ({ id: string } & ShExParser.shapeExprObject)[] = []
	for (const [id, label] of schema.labels) {
		shapes.push(makeLabelShape(id, label))
	}
	for (const [id, type] of schema.types) {
		shapes.push(makeShapeExpr(id, type))
	}
	return { type: "Schema", shapes }
}

function makeShapeExpr(
	id: string,
	type: APG.Type
): { id: string } & ShExParser.shapeExprObject {
	if (type.type === "unit") {
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

const token = new NamedNode(`urn:uuid:${uuid()}`)

function parseResult(
	node: NamedNode<string> | BlankNode | Literal,
	value: string | APG.Reference,
	result: SuccessResult,
	state: State
): Option<APG.Value> {
	if (typeof value === "string") {
		const type = state.schema.types.get(value)
		if (type === undefined) {
			throw new Error(`Invalid type id ${value}`)
		} else {
			return parseTypeResult(node, value, type, result, state)
		}
	} else {
		const label = state.schema.labels.get(value.value)
		if (label === undefined) {
			throw new Error(`Invalid label id ${value.value}`)
		} else {
			return parseReferenceResult(node, value.value, label, result, state)
		}
	}
}

const tokenRoot = uuid()

function parseReferenceResult(
	node: NamedNode<string> | BlankNode | Literal,
	id: string,
	label: APG.Label,
	result: SuccessResult,
	state: State
): Option<APG.Value> {
	if (isLabelResult(result, id, label.key)) {
		if (node instanceof BlankNode) {
			const key = `${id}\t${node.value}`
			const cache = state.cache.get(key)
			if (cache !== undefined) {
				return { _tag: "Some", value: cache }
			}

			const nextResult = parseLabelResult(result)
			const index = state.stack.length
			const token = { node, shape: id, used: false }
			state.stack.push(token)
			const match = parseResult(node, label.value, nextResult, state)
			state.stack.pop()
			if (match._tag === "None") {
				return match
			} else {
				const value = token.used
					? replaceToken(node, match.value, `urn:uuid:${tokenRoot}#${index}`)
					: match.value
				state.cache.set(key, match.value)
				return { _tag: "Some", value: value }
			}
		} else {
			throw new Error("Invalid result for reference type")
		}
	} else if (
		result.type === "Recursion" &&
		result.shape === getBlankNodeId(id)
	) {
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

function replaceToken(
	node: BlankNode,
	value: APG.Value,
	uri: string
): APG.Value {
	if (value.termType === "Product") {
		const product = new APG.ProductValue(value.node)
		for (const [id, leaf] of replaceLeaves(product, value, uri)) {
			product.children.set(id, leaf)
		}
		return product
	} else if (value.termType === "Coproduct") {
		const coproduct = new APG.CoproductValue<APG.Value>(
			value.node,
			value.option,
			node
		)
		coproduct.set(replaceTokenValue(coproduct, value.value, uri))
		return coproduct
	} else if (value.termType === "NamedNode" && value.value === uri) {
		return node
	} else {
		return value
	}
}

function replaceTokenValue(
	root: APG.Value,
	value: APG.Value,
	uri: string
): APG.Value {
	if (value.termType === "Product") {
		const product = new APG.ProductValue(value.node)
		for (const [id, leaf] of replaceLeaves(root, value, uri)) {
			product.children.set(id, leaf)
		}
		return product
	} else if (value.termType === "Coproduct") {
		const coproduct = new APG.CoproductValue<APG.Value>(
			value.node,
			value.option,
			root
		)
		coproduct.set(replaceTokenValue(root, value.value, uri))
		return coproduct
	} else if (value.termType === "NamedNode" && value.value === uri) {
		return root
	} else {
		return value
	}
}

function* replaceLeaves(
	root: APG.Value,
	product: APG.ProductValue,
	uri: string
): Iterable<[string, APG.Value]> {
	for (const [id, leaf] of product) {
		yield [id, replaceTokenValue(root, leaf, uri)]
	}
}

function parseTypeResult(
	node: NamedNode<string> | BlankNode | Literal,
	id: string,
	type: APG.Type,
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
				const components: Map<string, APG.Value> = new Map()
				if (type.components.size !== solutions.length) {
					throw new Error("Invalid product result")
				}

				const iter = zip(type.components, solutions)
				for (const [[componentId, component], solution] of iter) {
					if (componentId !== solution.productionLabel.slice(2)) {
						throw new Error("Invalid component result")
					}

					const {
						valueExpr,
						solutions: [{ object: objectValue, referenced: ref }],
					} = solution
					const object = parseObjectValue(objectValue)

					if (
						ref !== undefined &&
						valueExpr === getBlankNodeId(component.value)
					) {
						const match = parseResult(object, component.value, ref, state)
						if (match._tag === "None") {
							return match
						} else {
							components.set(componentId, match.value)
						}
					} else {
						throw new Error("Invalid component result")
					}
				}
				return { _tag: "Some", value: new APG.ProductValue(node, components) }
			} else {
				throw new Error("Invalid result for product type")
			}
		} else {
			return { _tag: "None" }
		}
	} else if (type.type === "coproduct") {
		if (isCoproductResult(result, id)) {
			if (node instanceof BlankNode) {
				const optionResult = parseCoproductResult(result)
				const optionId = optionResult.productionLabel.slice(2)
				const option = type.options.get(optionId)
				if (option === undefined) {
					throw new Error("Invalid option result")
				}

				const {
					valueExpr,
					solutions: [{ object: objectValue, referenced: ref }],
				} = optionResult
				const object = parseObjectValue(objectValue)

				if (ref !== undefined && valueExpr === getBlankNodeId(option.value)) {
					const match = parseResult(object, option.value, ref, state)
					if (match._tag === "None") {
						return match
					} else {
						const value = new APG.CoproductValue(node, optionId, match.value)
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
		signalInvalidType(id, type)
	}
}
