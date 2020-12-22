import * as N3 from "n3.ts"

import * as APG from "../../apg.js"
import * as ns from "../../namespace.js"
import {
	getKeys,
	signalInvalidType,
	getKeyIndex,
	forEntries,
	mapKeys,
} from "../../utils.js"

import schemaSchema, {
	SchemaSchema,
	value as valueType,
	label as labelType,
	component as componentType,
	option as optionType,
} from "./index.js"

type ValueTypeMap = typeof valueType extends APG.Coproduct<infer T> ? T : never

type TypeCache = {
	product: Map<number, APG.Product>
	coproduct: Map<number, APG.Coproduct>
}

type Sources = {
	components: Map<
		number,
		APG.Record<Link<typeof ns.product, typeof valueType>>[]
	>
	options: Map<
		number,
		APG.Record<Link<typeof ns.coproduct, typeof valueType>>[]
	>
}

export function toSchema(instance: APG.Instance<SchemaSchema>): APG.Schema {
	const labels = instance[ns.label]

	const sources: Sources = {
		components: rotateTree(instance[ns.component]),
		options: rotateTree(instance[ns.option]),
	}

	const typeCache: TypeCache = { product: new Map(), coproduct: new Map() }

	const permutation = new Map(
		labels.map((label, i) => {
			const { value: key } = label.get(ns.key)
			return [i, key]
		})
	)

	const schema: APG.Schema = Object.fromEntries(
		labels.map((label) => {
			const { value: key } = label.get(ns.key)
			const target = label.get(ns.value)
			const type = toType(target, instance, typeCache, sources, permutation)

			return [key, type]
		})
	)

	Object.freeze(schema)

	return schema
}

function toType(
	value: APG.Variant<ValueTypeMap>,
	instance: APG.Instance<SchemaSchema>,
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): APG.Type {
	if (value.is(ns.reference)) {
		const { index } = value.value
		return APG.reference(permutation.get(index)!)
	} else if (value.is(ns.uri)) {
		return APG.uri()
	} else if (value.is(ns.literal)) {
		const { value: datatype } = value.value
		return APG.literal(datatype)
	} else if (value.is(ns.product)) {
		const { index } = value.value
		return toProduct(index, instance, typeCache, sources, permutation)
	} else if (value.is(ns.coproduct)) {
		const { index } = value.value
		return toCoproduct(index, instance, typeCache, sources, permutation)
	} else {
		throw new Error(`Invalid value variant key ${value.key}`)
	}
}

function toProduct(
	index: number,
	instance: APG.Instance<SchemaSchema>,
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): APG.Product {
	if (typeCache.product.has(index)) {
		return typeCache.product.get(index)!
	}

	const components = sources.components.get(index)

	const product = APG.product(
		components === undefined
			? {}
			: Object.fromEntries(
					components.map((component) => {
						const { value: key } = component.get(ns.key)
						const value = toType(
							component.get(ns.value),
							instance,
							typeCache,
							sources,
							permutation
						)
						return [key, value]
					})
			  )
	)

	typeCache.product.set(index, product)
	return product
}

function toCoproduct(
	index: number,
	instance: APG.Instance<SchemaSchema>,
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): APG.Coproduct {
	if (typeCache.coproduct.has(index)) {
		return typeCache.coproduct.get(index)!
	}

	const options = Object.fromEntries(
		sources.options.get(index)!.map((option) => {
			const { value: key } = option.get(ns.key)
			const value = toType(
				option.get(ns.value),
				instance,
				typeCache,
				sources,
				permutation
			)
			return [key, value]
		})
	)

	const coproduct = APG.coproduct(options)
	typeCache.coproduct.set(index, coproduct)
	return coproduct
}

type Link<Key extends string, Value extends APG.Type> = {
	[ns.source]: APG.Reference<Key>
	[ns.key]: APG.Uri
	[ns.value]: Value
}

function rotateTree<Key extends string, Value extends APG.Type>(
	trees: APG.Record<Link<Key, Value>>[]
): Map<number, APG.Record<Link<Key, Value>>[]> {
	const result: Map<number, APG.Record<Link<Key, Value>>[]> = new Map()
	for (const tree of trees) {
		const { index } = tree.get(ns.source)
		const trees = result.get(index)
		if (trees === undefined) {
			result.set(index, [tree])
		} else {
			trees.push(tree)
		}
	}
	return result
}

const labelKeys = getKeys(labelType.components)
const componentKeys = getKeys(componentType.components)
const optionKeys = getKeys(optionType.components)
const valueKeys = getKeys(valueType.options)

export function fromSchema<S extends { [key in string]: APG.Type }>(
	schema: APG.Schema<S>
): APG.Instance<SchemaSchema> {
	const instance: APG.Instance<SchemaSchema> = mapKeys(schemaSchema, () => [])

	const cache = new Map<APG.Product | APG.Coproduct, number>()

	for (const key of getKeys(schema)) {
		const type = schema[key]
		const variant = new APG.Variant(
			valueKeys,
			ns[type.type],
			fromType(schema, instance, cache, type)
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
	instance: APG.Instance<SchemaSchema>,
	cache: Map<APG.Product | APG.Coproduct, number>,
	type: APG.Type
) {
	if (type.type === "reference") {
		return new APG.Pointer(getKeyIndex(schema, type.value))
	} else if (type.type === "uri") {
		return APG.unit()
	} else if (type.type === "literal") {
		return new N3.NamedNode(type.datatype)
	} else if (type.type === "product") {
		const pointer = cache.get(type)
		if (pointer !== undefined) {
			return new APG.Pointer(pointer)
		}

		const index = instance[ns.product].push(APG.unit()) - 1
		cache.set(type, index)

		for (const [key, value] of forEntries(type.components)) {
			instance[ns.component].push(
				new APG.Record(componentKeys, [
					new N3.NamedNode(key),
					new APG.Pointer(index),
					new APG.Variant(
						valueKeys,
						ns[value.type],
						fromType(schema, instance, cache, value)
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

		const index = instance[ns.coproduct].push(APG.unit()) - 1
		cache.set(type, index)

		for (const [key, value] of forEntries(type.options)) {
			instance[ns.option].push(
				new APG.Record(optionKeys, [
					new N3.NamedNode(key),
					new APG.Pointer(index),
					new APG.Variant(
						valueKeys,
						ns[value.type],
						fromType(schema, instance, cache, value)
					),
				])
			)
		}

		return new APG.Pointer(index)
	} else {
		signalInvalidType(type)
	}
}
