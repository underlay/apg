import {
	NamedNode,
	BlankNode,
	Store,
	Literal,
	D,
	Object,
	Subject,
	Parse,
	rdf,
} from "n3.ts"

type Either<L, R> = { _tag: "Left"; left: L } | { _tag: "Right"; right: R }

import ShExParser from "@shexjs/parser"
import ShExUtil from "@shexjs/util"
import ShExValidator, {
	SuccessResult,
	FailureResult,
	ShapeTest,
	NodeConstraintTest,
} from "@shexjs/validator"

import {
	Label,
	Type,
	Value,
	Tree,
	isReference,
	ProductType,
	CoproductType,
	NilType,
	Option,
	Component,
	ReferenceType,
} from "./schema.js"

import {
	zip,
	isBlankNodeConstraint,
	isNamedNodeConstraint,
	isDatatypeConstraint,
	parseObjectValue,
	blankNodeConstraint,
	isAnyTypeResult,
} from "./utils.js"

import { nilShapeExpr, isNilShapeResult, isEmptyShape } from "./nil.js"

import { isIriResult, makeIriShape } from "./iri.js"

import {
	isLabelResult,
	parseLabelResult,
	makeLabelShape,
	LabelShape,
} from "./reference.js"

import { isLiteralResult, makeLiteralShape } from "./literal.js"

import {
	isProductResult,
	parseProductResult,
	makeProductShape,
} from "./product.js"

import {
	isShapeOr,
	isShapeOrResult,
	matchResultOption,
	makeCoproductShape,
} from "./coproduct.js"

const ns = {
	label: "http://underlay.org/ns/label",
	nil: "http://underlay.org/ns/nil",
	product: "http://underlay.org/ns/product",
	coproduct: "http://underlay.org/ns/coproduct",
	component: "http://underlay.org/ns/component",
	option: "http://underlay.org/ns/option",
	source: "http://underlay.org/ns/source",
	key: "http://underlay.org/ns/key",
	value: "http://underlay.org/ns/value",
	iri: "http://underlay.org/ns/iri",
	literal: "http://underlay.org/ns/literal",
	datatype: "http://underlay.org/ns/datatype",
	pattern: "http://underlay.org/ns/pattern",
	flags: "http://underlay.org/ns/flags",
}

function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error(`Invalid type: ${type}`)
}

export function makeShExSchema(labels: Label[]): [ShapeMap, ShExParser.Schema] {
	const shapeMap: ShapeMap = new Map()
	for (const label of labels) {
		const value = makeShapeExpr(label.value)
		shapeMap.set(label.id, makeLabelShape(label, value))
	}
	const shexSchema: ShExParser.Schema = {
		type: "Schema",
		shapes: Array.from(shapeMap.values()),
	}
	return [shapeMap, shexSchema]
}

function makeShapeExpr(type: Type): ShExParser.shapeExpr {
	if (isReference(type)) {
		return type.id
	} else if (type.type === "nil") {
		return nilShapeExpr
	} else if (type.type === "iri") {
		return makeIriShape(type)
	} else if (type.type === "literal") {
		return makeLiteralShape(type)
	} else if (type.type === "product") {
		return makeProductShape(type, makeShapeExpr)
	} else if (type.type === "coproduct") {
		return makeCoproductShape(type, makeShapeExpr)
	} else {
		signalInvalidType(type)
	}
}

type LabelMap = Map<string, Label>
type ShapeMap = Map<string, LabelShape>
type State = Readonly<{ labelMap: LabelMap; shapeMap: ShapeMap }>

const rdfType = new NamedNode(rdf.type)

export function parseSchemaString(
	input: string,
	schemaSchema: Label[]
): Label[] {
	const store = new Store(Parse(input))
	return parseSchema(store, schemaSchema)
}

export function parseSchema(store: Store, schemaSchema: Label[]): Label[] {
	const map: Map<string, Map<string, Value>> = new Map()
	for (const [label, values] of parse(store, schemaSchema)) {
		const results: Map<string, Value> = new Map()
		map.set(label.key, results)
		for (const [{ value: key }, value] of values) {
			if (value._tag === "Right") {
				results.set(key, value.right)
			}
		}
	}

	const nil: NilType = { type: "nil" }

	const productTypes: Map<string, ProductType> = new Map()
	for (const { value } of map.get(ns.product)!.values()) {
		productTypes.set(value, { type: "product", components: [] })
	}

	const componentValues: Map<string, Value> = new Map()
	for (const componentType of map.get(ns.component)!.values()) {
		if (componentType.termType === "Tree") {
			const { value } = componentType.get(ns.source)!
			const { value: key } = componentType.get(ns.key)!
			componentValues.set(componentType.value, componentType.get(ns.value)!)
			const component: Component = {
				type: "component",
				key,
				value: { id: componentType.value },
			}
			productTypes.get(value)!.components.push(component)
		} else {
			throw new Error("Invalid component type")
		}
	}

	const coproductTypes: Map<string, CoproductType> = new Map()
	for (const { value } of map.get(ns.coproduct)!.values()) {
		coproductTypes.set(value, { type: "coproduct", options: [] })
	}

	const optionValues: Map<string, Value> = new Map()
	for (const optionType of map.get(ns.option)!.values()) {
		if (optionType.termType === "Tree") {
			const { value } = optionType.get(ns.source)!
			optionValues.set(optionType.value, optionType.get(ns.value)!)
			const option: Option = { type: "option", value: { id: optionType.value } }
			coproductTypes.get(value)!.options.push(option)
		} else {
			throw new Error("Invalid option type")
		}
	}

	const iriTypes = new Set(map.get(ns.iri)!.keys())
	const literalTypes = new Set(map.get(ns.literal)!.keys())
	const nilTypes = new Set(map.get(ns.nil)!.keys())
	const labels = map.get(ns.label)!

	const labelTypes: Map<string, Label> = new Map()
	for (const labelType of labels.values()) {
		if (labelType.termType === "Tree") {
			const { value: key } = labelType.get(ns.key)!
			labelTypes.set(labelType.value, {
				id: `_:${labelType.value}`,
				type: "label",
				key,
				value: nil,
			})
		} else {
			throw new Error("Invalid label type")
		}
	}

	function parseValue(value: Value): Type {
		if (value.termType === "BlankNode") {
			if (productTypes.has(value.value)) {
				const product = productTypes.get(value.value)!
				for (const component of product.components) {
					const { id } = component.value as ReferenceType
					const value = componentValues.get(id)!
					component.value = parseValue(value)
					componentValues.delete(id)
				}
				productTypes.delete(value.value)
				return product
			} else if (coproductTypes.has(value.value)) {
				const coproduct = coproductTypes.get(value.value)!
				for (const option of coproduct.options) {
					const { id } = option.value as ReferenceType
					const value = optionValues.get(id)!
					option.value = parseValue(value)
					optionValues.delete(id)
				}
				coproductTypes.delete(value.value)
				return coproduct
			} else if (nilTypes.has(value.value)) {
				nilTypes.delete(value.value)
				return { type: "nil" }
			} else if (iriTypes.has(value.value)) {
				return { type: "iri" }
			} else {
				throw new Error("Invalid blank node value")
			}
		} else if (value.termType === "Tree") {
			if (labelTypes.has(value.value)) {
				const { id } = labelTypes.get(value.value)!
				return { id }
			} else if (iriTypes.has(value.value)) {
				const { value: pattern } = value.get(ns.pattern)!
				const { value: flags } = value.get(ns.flags)!
				return { type: "iri", pattern, flags }
			} else if (literalTypes.has(value.value)) {
				const { value: datatype } = value.get(ns.datatype)!
				if (value.size === 1) {
					return { type: "literal", datatype }
				} else if (value.size === 3) {
					const { value: pattern } = value.get(ns.pattern)!
					const { value: flags } = value.get(ns.flags)!
					return { type: "literal", datatype, pattern, flags }
				} else {
					throw new Error("Invalid literal value")
				}
			} else {
				throw new Error("Invalid tree value")
			}
		} else {
			throw new Error("Invalid value")
		}
	}

	for (const labelType of labels.values()) {
		if (labelType.termType === "Tree") {
			const label = labelTypes.get(labelType.value)!
			const value = labelType.get(ns.value)!
			label.value = parseValue(value)
		} else {
			throw new Error("Invalid label type")
		}
	}

	return Array.from(labelTypes.values())
}

export function* parse(
	store: Store,
	labels: Label[]
): Generator<
	[Label, Generator<[Subject<D>, Either<FailureResult, Value>]>],
	void,
	undefined
> {
	const db = ShExUtil.makeN3DB(store)
	const [shapeMap, shexSchema] = makeShExSchema(labels)
	const labelMap = new Map(labels.map((label) => [label.id, label]))
	const state = Object.freeze({ labelMap, shapeMap })
	const validator = ShExValidator.construct(shexSchema, {})

	for (const label of labels) {
		yield [label, parseLabel(label, state, store, db, validator)]
	}
}

function* parseLabel(
	label: Label,
	state: State,
	store: Store,
	db: ShExUtil.N3DB,
	validator: ShExValidator
): Generator<[Subject<D>, Either<FailureResult, Value>]> {
	const type = new NamedNode(label.key)
	for (const subject of store.subjects(rdfType, type, null)) {
		const result = validator.validate(db, subject.id, label.id)
		yield [
			subject,
			parseResult(
				subject as Object<D>,
				{ id: label.id },
				result,
				label.id,
				state
			),
		]
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
	node: Object<D>,
	type: Type,
	result: SuccessResult | FailureResult,
	shapeExpr: ShExParser.shapeExpr,
	state: State
): Either<FailureResult, Value> {
	if (isFailure(result)) {
		return { _tag: "Left", left: result }
	} else if (isReference(type)) {
		if (isLabelResult(result) && typeof shapeExpr === "string") {
			const label = state.labelMap.get(type.id)!
			const [object, shape, nextResult] = parseLabelResult(result)
			if (object === label.key && shape === shapeExpr) {
				const { shapeExprs } = state.shapeMap.get(shape)!
				const [_, nextExpr] = shapeExprs
				return parseResult(node, label.value, nextResult, nextExpr, state)
			} else {
				throw new Error("Invalid label result")
			}
		} else {
			throw new Error("Invalid result for label type")
		}
	} else if (type.type === "nil") {
		console.log(
			"result!",
			JSON.stringify(result, null, "  "),
			isNilShapeResult(result)
		)
		if (isNilShapeResult(result) && node instanceof BlankNode) {
			return { _tag: "Right", right: node }
		} else {
			throw new Error("Invalid result for nil type")
		}
	} else if (type.type === "literal") {
		if (isLiteralResult(result) && node instanceof Literal) {
			return { _tag: "Right", right: node }
		} else {
			throw new Error("Invalid result for literal type")
		}
	} else if (type.type === "iri") {
		if (isIriResult(result) && node instanceof NamedNode) {
			return { _tag: "Right", right: node }
		} else {
			throw new Error("Invalid result for iri type")
		}
	} else if (type.type === "product") {
		if (isProductResult(result) && node instanceof BlankNode) {
			const solutions = parseProductResult(result)
			const children: Map<string, Value> = new Map()
			for (const [component, solution] of zip(type.components, solutions)) {
				const nextType = isReference(component.value)
					? "label"
					: component.value.type
				const {
					valueExpr,
					solutions: [{ object, referenced }],
				} = solution
				const o = parseObjectValue(object)
				if (referenced !== undefined) {
					const r = wrapReference(referenced, valueExpr)
					const value = parseResult(o, component.value, r, valueExpr, state)
					if (value._tag === "Right") {
						children.set(component.key, value.right)
					} else {
						return value
					}
				} else if (
					isDatatypeConstraint(valueExpr) &&
					nextType === "literal" &&
					o instanceof Literal
				) {
					children.set(component.key, o)
				} else if (
					isNamedNodeConstraint(valueExpr) &&
					nextType === "iri" &&
					o instanceof NamedNode
				) {
					children.set(component.key, o)
				} else {
					throw new Error("Invalid TripleConstraintSolutions result")
				}
			}
			return { _tag: "Right", right: new Tree(node, children) }
		} else {
			throw new Error("Invalid result for product type")
		}
	} else if (type.type === "coproduct") {
		// TODO: this is maybe unnecessary
		const r = isShapeOrResult(result) ? result.solution : result
		if (
			isShapeOr(shapeExpr) &&
			shapeExpr.shapeExprs.length === type.options.length
		) {
			const index = matchResultOption(r, shapeExpr.shapeExprs)
			if (index === -1) {
				throw new Error("Could not match ShapeOr expression")
			} else {
				const optionType = type.options[index].value
				const optionExpr = shapeExpr.shapeExprs[index]
				return parseResult(node, optionType, r, optionExpr, state)
			}
		} else {
			throw new Error("Invalid result for coproduct type big hm")
		}
	} else {
		signalInvalidType(type)
	}
}

function isUnwrappedProductReference(
	reference: ShapeTest,
	valueExpr: ShExParser.shapeExpr
): boolean {
	if (typeof valueExpr === "string") {
		return false
	} else if (valueExpr.type === "ShapeOr") {
		return valueExpr.shapeExprs.some((shapeExpr) =>
			isUnwrappedProductReference(reference, shapeExpr)
		)
	} else if (
		valueExpr.type === "ShapeAnd" &&
		valueExpr.shapeExprs.length === 2
	) {
		const [nodeConstraint, shapeExpr] = valueExpr.shapeExprs
		if (
			isBlankNodeConstraint(nodeConstraint) &&
			typeof shapeExpr !== "string" &&
			shapeExpr.type === "Shape" &&
			shapeExpr.expression !== undefined &&
			typeof shapeExpr.expression !== "string" &&
			shapeExpr.expression.type === "EachOf" &&
			reference.solution.type === "EachOfSolutions" &&
			reference.solution.solutions.length === 1
		) {
			const tripleExprs = shapeExpr.expression.expressions
			const [{ expressions }] = reference.solution.solutions
			for (const [expression, tripleExpr] of zip(expressions, tripleExprs)) {
				if (expression.type !== "TripleConstraintSolutions") {
					return false
				} else if (typeof tripleExpr === "string") {
					return false
				} else if (tripleExpr.type !== "TripleConstraint") {
					return false
				} else if (expression.predicate !== tripleExpr.predicate) {
					return false
				} else if (expression.valueExpr !== tripleExpr.valueExpr) {
					return false
				}
			}
			return true
		} else {
			return false
		}
	} else {
		return false
	}
}

function getUnwrappedIriReference(
	reference: SuccessResult,
	valueExpr: ShExParser.shapeExpr
): ShExParser.NodeConstraint | null {
	if (typeof valueExpr === "string") {
		return null
	} else if (valueExpr.type === "ShapeOr") {
		for (const shapeExpr of valueExpr.shapeExprs) {
			const nodeConstraint = getUnwrappedIriReference(reference, shapeExpr)
			if (nodeConstraint !== null) {
				return nodeConstraint
			}
		}
		return null
	} else if (
		valueExpr.type === "ShapeAnd" &&
		valueExpr.shapeExprs.length === 2
	) {
		const [nodeConstraint, shapeExpr] = valueExpr.shapeExprs
		if (
			isNamedNodeConstraint(nodeConstraint) &&
			isEmptyShape(shapeExpr) &&
			reference.type === "ShapeTest" &&
			isAnyTypeResult(reference.solution)
		) {
			return nodeConstraint
		} else {
			return null
		}
	} else {
		return null
	}
}

function wrapReference(
	reference: SuccessResult,
	valueExpr: ShExParser.shapeExpr
): SuccessResult {
	if (reference.type !== "ShapeTest") {
		return reference
	} else if (isUnwrappedProductReference(reference, valueExpr)) {
		const nodeTest: NodeConstraintTest = {
			type: "NodeConstraintTest",
			node: reference.node,
			shape: reference.shape,
			shapeExpr: blankNodeConstraint,
		}
		return {
			type: "ShapeAndResults",
			solutions: [nodeTest, reference],
		}
	} else {
		const nodeConstraint = getUnwrappedIriReference(reference, valueExpr)
		if (nodeConstraint !== null) {
			const nodeTest: NodeConstraintTest = {
				type: "NodeConstraintTest",
				node: reference.node,
				shape: reference.shape,
				shapeExpr: nodeConstraint,
			}
			return {
				type: "ShapeAndResults",
				solutions: [nodeTest, reference],
			}
		}
	}

	return reference
}
