import {
	Schema,
	Instance,
	getKeys,
	signalInvalidType,
	getKeyIndex,
	forEntries,
	mapKeys,
} from "@underlay/apg"
import { ul } from "@underlay/namespaces"

import schemaSchema, {
	SchemaSchema,
	value as valueType,
	label as labelType,
	component as componentType,
	option as optionType,
} from "./schema.js"

type ValueTypeMap = typeof valueType extends Schema.Coproduct<infer T>
	? T
	: never

type TypeCache = {
	product: Map<number, Schema.Product>
	coproduct: Map<number, Schema.Coproduct>
}

type Sources = {
	components: Map<
		number,
		Instance.Product<Link<typeof ul.product, typeof valueType>>[]
	>
	options: Map<
		number,
		Instance.Product<Link<typeof ul.coproduct, typeof valueType>>[]
	>
}

export function toSchema(
	instance: Instance.Instance<SchemaSchema>
): Schema.Schema {
	const labels = instance[ul.label]

	const sources: Sources = {
		components: rotateTree(instance[ul.component]),
		options: rotateTree(instance[ul.option]),
	}

	const typeCache: TypeCache = { product: new Map(), coproduct: new Map() }

	const permutation = new Map(
		labels.map((label, i) => {
			const { value: key } = label.get(ul.key)
			return [i, key]
		})
	)

	const schema: Schema.Schema = Object.fromEntries(
		labels.map((label) => {
			const { value: key } = label.get(ul.key)
			const target = label.get(ul.value)
			const type = toType(target, instance, typeCache, sources, permutation)

			return [key, type]
		})
	)

	Object.freeze(schema)

	return schema
}

function toType(
	value: Instance.Coproduct<ValueTypeMap>,
	instance: Instance.Instance<SchemaSchema>,
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): Schema.Type {
	if (value.is(ul.reference)) {
		const { index } = value.value
		return Schema.reference(permutation.get(index)!)
	} else if (value.is(ul.uri)) {
		return Schema.uri()
	} else if (value.is(ul.literal)) {
		const { value: datatype } = value.value
		return Schema.literal(datatype)
	} else if (value.is(ul.product)) {
		const { index } = value.value
		return toProduct(index, instance, typeCache, sources, permutation)
	} else if (value.is(ul.coproduct)) {
		const { index } = value.value
		return toCoproduct(index, instance, typeCache, sources, permutation)
	} else {
		throw new Error(`Invalid value variant key ${value.key}`)
	}
}

function toProduct(
	index: number,
	instance: Instance.Instance<SchemaSchema>,
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): Schema.Product {
	if (typeCache.product.has(index)) {
		return typeCache.product.get(index)!
	}

	const components = sources.components.get(index)

	const product = Schema.product(
		components === undefined
			? {}
			: Object.fromEntries(
					components.map((component) => {
						const { value: key } = component.get(ul.key)
						const value = toType(
							component.get(ul.value),
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
	instance: Instance.Instance<SchemaSchema>,
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): Schema.Coproduct {
	if (typeCache.coproduct.has(index)) {
		return typeCache.coproduct.get(index)!
	}

	const options = Object.fromEntries(
		sources.options.get(index)!.map((option) => {
			const { value: key } = option.get(ul.key)
			const value = toType(
				option.get(ul.value),
				instance,
				typeCache,
				sources,
				permutation
			)
			return [key, value]
		})
	)

	const coproduct = Schema.coproduct(options)
	typeCache.coproduct.set(index, coproduct)
	return coproduct
}

type Link<Key extends string, Value extends Schema.Type> = {
	[ul.source]: Schema.Reference<Key>
	[ul.key]: Schema.Uri
	[ul.value]: Value
}

function rotateTree<Key extends string, Value extends Schema.Type>(
	trees: Instance.Product<Link<Key, Value>>[]
): Map<number, Instance.Product<Link<Key, Value>>[]> {
	const result: Map<number, Instance.Product<Link<Key, Value>>[]> = new Map()
	for (const tree of trees) {
		const { index } = tree.get(ul.source)
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

export function fromSchema<S extends { [key in string]: Schema.Type }>(
	schema: Schema.Schema<S>
): Instance.Instance<SchemaSchema> {
	const instance: Instance.Instance<SchemaSchema> = mapKeys(
		schemaSchema,
		() => []
	)

	const cache = new Map<Schema.Product | Schema.Coproduct, number>()

	for (const key of getKeys(schema)) {
		const type = schema[key]
		const variant = Instance.coproduct(
			valueKeys,
			ul[type.type],
			fromType(schema, instance, cache, type)
		)
		instance[ul.label].push(
			Instance.product(labelKeys, [Instance.uri(key), variant])
		)
	}

	for (const key of getKeys(schemaSchema)) {
		Object.freeze(instance[key])
	}

	Object.freeze(instance)

	return instance
}

function fromType(
	schema: Schema.Schema,
	instance: Instance.Instance<SchemaSchema>,
	cache: Map<Schema.Product | Schema.Coproduct, number>,
	type: Schema.Type
) {
	if (type.type === "reference") {
		return Instance.reference(getKeyIndex(schema, type.value))
	} else if (type.type === "uri") {
		return Instance.unit()
	} else if (type.type === "literal") {
		return Instance.uri(type.datatype)
	} else if (type.type === "product") {
		const pointer = cache.get(type)
		if (pointer !== undefined) {
			return Instance.reference(pointer)
		}

		const index = instance[ul.product].push(Instance.unit()) - 1
		cache.set(type, index)

		for (const [key, value] of forEntries(type.components)) {
			instance[ul.component].push(
				Instance.product(componentKeys, [
					Instance.uri(key),
					Instance.reference(index),
					Instance.coproduct(
						valueKeys,
						ul[value.type],
						fromType(schema, instance, cache, value)
					),
				])
			)
		}

		return Instance.reference(index)
	} else if (type.type === "coproduct") {
		const pointer = cache.get(type)
		if (pointer !== undefined) {
			return Instance.reference(pointer)
		}

		const index = instance[ul.coproduct].push(Instance.unit()) - 1
		cache.set(type, index)

		for (const [key, value] of forEntries(type.options)) {
			instance[ul.option].push(
				Instance.product(optionKeys, [
					Instance.uri(key),
					Instance.reference(index),
					Instance.coproduct(
						valueKeys,
						ul[value.type],
						fromType(schema, instance, cache, value)
					),
				])
			)
		}

		return Instance.reference(index)
	} else {
		signalInvalidType(type)
	}
}
