import * as N3 from "n3.ts"

import APG from "../../apg.js"
import schemaSchema from "./index.js"
import * as ns from "../../namespace.js"
import {
	getKeys,
	getID,
	ID,
	signalInvalidType,
	getKeyIndex,
	getEntries,
	freezeType,
	mapKeys,
} from "../../utils.js"
import { TypeC } from "io-ts"

type TypeCache = {
	product: Map<number, APG.Product>
	coproduct: Map<number, APG.Coproduct>
}

export function toSchema(instance: APG.Instance): APG.Schema {
	const labels = instance[ns.label] as APG.Record[]
	const components = instance[ns.component] as APG.Record[]
	const options = instance[ns.option] as APG.Record[]

	const componentSources = rotateTree(components, ns.source)
	const optionSources = rotateTree(options, ns.source)

	const typeCache: TypeCache = { product: new Map(), coproduct: new Map() }
	//  = new Map(
	// 	getKeys(schemaSchema).map((key) => [key, new Map()])
	// )

	const permutation = new Map(
		labels.map((label, i) => {
			const { value: key } = label.get(ns.key) as N3.NamedNode
			return [i, key]
		})
	)

	const schema: APG.Schema = Object.fromEntries(
		labels.map((label) => {
			const { value: key } = label.get(ns.key) as N3.NamedNode<string>
			const target = label.get(ns.value) as APG.Variant
			const type = toType(
				target,
				instance,
				typeCache,
				componentSources,
				optionSources,
				permutation
			)
			freezeType(type)
			return [key, type]
		})
	)

	Object.freeze(schema)

	return schema
}

function toType(
	value: APG.Variant,
	instance: APG.Instance,
	typeCache: TypeCache,
	componentSources: Map<number, APG.Record[]>,
	optionSources: Map<number, APG.Record[]>,
	permutation: Map<number, string>
): APG.Type {
	const key = value.option
	if (key === ns.reference) {
		const { index } = value.value as APG.Pointer
		return { type: "reference", value: permutation.get(index)! }
	} else if (key === ns.unit) {
		return { type: "unit" }
	} else if (key === ns.uri) {
		return { type: "uri" }
	} else if (key === ns.literal) {
		const { value: datatype } = value.value as N3.NamedNode
		return { type: "literal", datatype }
	} else if (key === ns.product) {
		const { index } = value.value as APG.Pointer
		return toProduct(
			index,
			instance,
			typeCache,
			componentSources,
			optionSources,
			permutation
		)
	} else if (key === ns.coproduct) {
		const { index } = value.value as APG.Pointer
		return toCoproduct(
			index,
			instance,
			typeCache,
			componentSources,
			optionSources,
			permutation
		)
	} else {
		throw new Error(`Invalid value variant key ${key}`)
	}
}

function toProduct(
	index: number,
	instance: APG.Instance,
	typeCache: TypeCache,
	componentSources: Map<number, APG.Record[]>,
	optionSources: Map<number, APG.Record[]>,
	permutation: Map<number, string>
): APG.Product {
	if (typeCache.product.has(index)) {
		return typeCache.product.get(index)!
	}

	const components = Object.fromEntries(
		componentSources.get(index)!.map((component) => {
			const { value: key } = component.get(ns.key) as N3.NamedNode
			const value = toType(
				component.get(ns.value) as APG.Variant,
				instance,
				typeCache,
				componentSources,
				optionSources,
				permutation
			)
			return [key, value]
		})
	)

	const product: APG.Product = { type: "product", components }
	typeCache.product.set(index, product)
	return product
}

function toCoproduct(
	index: number,
	instance: APG.Instance,
	typeCache: TypeCache,
	componentSources: Map<number, APG.Record[]>,
	optionSources: Map<number, APG.Record[]>,
	permutation: Map<number, string>
): APG.Coproduct {
	if (typeCache.coproduct.has(index)) {
		return typeCache.coproduct.get(index)!
	}

	const options = Object.fromEntries(
		optionSources.get(index)!.map((option) => {
			const { value: key } = option.get(ns.key) as N3.NamedNode
			const value = toType(
				option.get(ns.value) as APG.Variant,
				instance,
				typeCache,
				componentSources,
				optionSources,
				permutation
			)
			return [key, value]
		})
	)

	const coproduct: APG.Coproduct = { type: "coproduct", options }
	typeCache.coproduct.set(index, coproduct)
	return coproduct
}

function rotateTree(
	trees: APG.Record[],
	pivot: string
): Map<number, APG.Record[]> {
	const result: Map<number, APG.Record[]> = new Map()
	for (const tree of trees) {
		const value = tree.get(pivot)
		if (value === undefined || value.termType !== "Pointer") {
			throw new Error("Rotation failed because the value was not a pointer")
		}
		const trees = result.get(value.index)
		if (trees === undefined) {
			result.set(value.index, [tree])
		} else {
			trees.push(tree)
		}
	}
	return result
}

const ul = {
	label: new N3.NamedNode(ns.label),
	key: new N3.NamedNode(ns.key),
	value: new N3.NamedNode(ns.value),
	reference: new N3.NamedNode(ns.reference),
	unit: new N3.NamedNode(ns.unit),
	uri: new N3.NamedNode(ns.uri),
	literal: new N3.NamedNode(ns.literal),
	datatype: new N3.NamedNode(ns.datatype),
	product: new N3.NamedNode(ns.product),
	component: new N3.NamedNode(ns.component),
	coproduct: new N3.NamedNode(ns.coproduct),
	option: new N3.NamedNode(ns.option),
	source: new N3.NamedNode(ns.source),
}

const labelKeys = Object.freeze([ns.key, ns.value])
const referenceKeys = Object.freeze([ns.value])
const literalKeys = Object.freeze([ns.datatype])
const productKeys = Object.freeze([ns.key, ns.source, ns.value])
const coproductKeys = Object.freeze([ns.key, ns.source, ns.value])

export function fromSchema(schema: APG.Schema): APG.Instance {
	const id = getID()

	const instance: APG.Instance = mapKeys(schemaSchema, () => [])

	const cache = new Map<APG.Product | APG.Coproduct, number>()

	for (const key of getKeys(schema)) {
		const type = schema[key]
		const variant = new APG.Variant(
			ul[type.type].value,
			fromType(schema, instance, cache, id, type)
		)
		instance[ns.label].push(
			new APG.Record(labelKeys, [new N3.NamedNode(key), variant])
		)
	}

	for (const key of getKeys(schemaSchema)) {
		Object.freeze(instance[key])
	}

	Object.freeze(instance)

	return instance
}

function fromType(
	schema: APG.Schema,
	instance: APG.Instance,
	cache: Map<APG.Product | APG.Coproduct, number>,
	id: ID,
	type: APG.Type
): APG.Value {
	if (type.type === "reference") {
		return new APG.Pointer(getKeyIndex(schema, type.value))
	} else if (type.type === "unit") {
		return id()
	} else if (type.type === "uri") {
		return id()
	} else if (type.type === "literal") {
		return new N3.NamedNode(type.datatype)
	} else if (type.type === "product") {
		const pointer = cache.get(type)
		if (pointer !== undefined) {
			return new APG.Pointer(pointer)
		}

		const index = instance[ns.product].push(id()) - 1
		cache.set(type, index)

		for (const [key, value] of getEntries(type.components)) {
			instance[ns.component].push(
				new APG.Record(productKeys, [
					new N3.NamedNode(key),
					new APG.Pointer(index),
					new APG.Variant(
						ul[value.type].value,
						fromType(schema, instance, cache, id, value)
					),
				])
			)
		}

		return new APG.Pointer(index)
	} else if (type.type === "coproduct") {
		const pointer = cache.get(type)
		if (pointer !== undefined) {
			return new APG.Pointer(pointer)
		}

		const index = instance[ns.coproduct].push(id()) - 1
		cache.set(type, index)

		for (const [key, value] of getEntries(type.options)) {
			instance[ns.option].push(
				new APG.Record(coproductKeys, [
					new N3.NamedNode(key),
					new APG.Pointer(index),
					new APG.Variant(
						ul[value.type].value,
						fromType(schema, instance, cache, id, value)
					),
				])
			)
		}

		return new APG.Pointer(index)
	} else {
		signalInvalidType(type)
	}
}
