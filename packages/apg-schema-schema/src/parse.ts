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
	const labelType = schemaSchema[ul.label]
	const labelValues = instance[ul.label]

	const sources: Sources = {
		components: rotateTree(componentType, instance[ul.component]),
		options: rotateTree(optionType, instance[ul.option]),
	}

	const typeCache: TypeCache = { product: new Map(), coproduct: new Map() }

	const permutation = new Map(
		labelValues.map((label, i) => {
			const { value: key } = label.get(labelType, ul.key)
			return [i, key]
		})
	)

	const schema: Schema.Schema = Object.fromEntries(
		labelValues.map((label) => {
			const { value: key } = label.get(labelType, ul.key)
			const type = toType(
				label.get(labelType, ul.value),
				typeCache,
				sources,
				permutation
			)

			return [key, type]
		})
	)

	Object.freeze(schema)

	return schema
}

function toType(
	value: Instance.Coproduct<ValueTypeMap>,
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): Schema.Type {
	if (value.is(valueType, ul.reference)) {
		const { index } = value.value
		return Schema.reference(permutation.get(index)!)
	} else if (value.is(valueType, ul.uri)) {
		return Schema.uri()
	} else if (value.is(valueType, ul.literal)) {
		const { value: datatype } = value.value
		return Schema.literal(datatype)
	} else if (value.is(valueType, ul.product)) {
		const { index } = value.value
		return toProduct(index, typeCache, sources, permutation)
	} else if (value.is(valueType, ul.coproduct)) {
		const { index } = value.value
		return toCoproduct(index, typeCache, sources, permutation)
	} else {
		throw new Error(`Invalid value variant key ${value.key}`)
	}
}

function toProduct(
	index: number,
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
						const { value: key } = component.get(componentType, ul.key)
						const value = toType(
							component.get(componentType, ul.value),
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
	typeCache: TypeCache,
	sources: Sources,
	permutation: Map<number, string>
): Schema.Coproduct {
	if (typeCache.coproduct.has(index)) {
		return typeCache.coproduct.get(index)!
	}

	const options = Object.fromEntries(
		sources.options.get(index)!.map((option) => {
			const { value: key } = option.get(optionType, ul.key)
			const value = toType(
				option.get(optionType, ul.value),
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
	type: Schema.Product<Link<Key, Value>>,
	trees: Instance.Product<Link<Key, Value>>[]
): Map<number, Instance.Product<Link<Key, Value>>[]> {
	const result: Map<number, Instance.Product<Link<Key, Value>>[]> = new Map()
	for (const tree of trees) {
		const { index } = tree.get(type, ul.source)
		const trees = result.get(index)
		if (trees === undefined) {
			result.set(index, [tree])
		} else {
			trees.push(tree)
		}
	}
	return result
}

const componentKeys = getKeys(componentType.components)
const optionKeys = getKeys(optionType.components)
const valueKeys = getKeys(valueType.options)

export function fromSchema(
	schema: Schema.Schema
): Instance.Instance<SchemaSchema> {
	const instance: Instance.Instance<SchemaSchema> = mapKeys(
		schemaSchema,
		() => []
	)

	const cache = new Map<Schema.Product | Schema.Coproduct, number>()

	for (const key of getKeys(schema)) {
		const type = schema[key]
		const variant = Instance.coproduct(
			valueType,
			ul[type.kind],
			fromType(schema, instance, cache, type)
		)
		instance[ul.label].push(
			Instance.product(labelType, {
				[ul.key]: new Instance.Uri(key),
				[ul.value]: variant,
			})
		)
	}

	for (const key of getKeys(schemaSchema)) {
		Object.freeze(instance[key])
	}

	Object.freeze(instance)

	return instance
}

const unit = Schema.unit()

function fromType(
	schema: Schema.Schema,
	instance: Instance.Instance<SchemaSchema>,
	cache: Map<Schema.Product | Schema.Coproduct, number>,
	type: Schema.Type
) {
	if (type.kind === "reference") {
		return new Instance.Reference(getKeyIndex(schema, type.value))
	} else if (type.kind === "uri") {
		return Instance.unit(unit)
	} else if (type.kind === "literal") {
		return new Instance.Uri(type.datatype)
	} else if (type.kind === "product") {
		const pointer = cache.get(type)
		if (pointer !== undefined) {
			return new Instance.Reference(pointer)
		}

		const index = instance[ul.product].push(Instance.unit(unit)) - 1
		cache.set(type, index)

		for (const [key, value] of forEntries(type.components)) {
			instance[ul.component].push(
				Instance.product(componentType, {
					[ul.key]: new Instance.Uri(key),
					[ul.source]: new Instance.Reference(index),
					[ul.value]: Instance.coproduct(
						valueType,
						ul[value.kind],
						fromType(schema, instance, cache, value)
					),
				})
			)
		}

		return new Instance.Reference(index)
	} else if (type.kind === "coproduct") {
		const pointer = cache.get(type)
		if (pointer !== undefined) {
			return new Instance.Reference(pointer)
		}

		const index = instance[ul.coproduct].push(Instance.unit(unit)) - 1
		cache.set(type, index)

		for (const [key, value] of forEntries(type.options)) {
			instance[ul.option].push(
				Instance.product(optionType, {
					[ul.key]: new Instance.Uri(key),
					[ul.source]: new Instance.Reference(index),
					[ul.value]: Instance.coproduct(
						valueType,
						ul[value.kind],
						fromType(schema, instance, cache, value)
					),
				})
			)
		}

		return new Instance.Reference(index)
	} else {
		signalInvalidType(type)
	}
}
