import t from "io-ts"
import * as N3 from "n3.ts"

import { equal, signalInvalidType, sortKeys, zip, zip3 } from "./utils.js"

namespace APG {
	export type Schema = Label[]

	export type Label = Readonly<{ type: "label"; key: string; value: Type }>

	export type Type = Unit | Iri | Literal | Product | Coproduct | Reference
	export type Reference = Readonly<{ type: "reference"; value: number }>
	export type Unit = Readonly<{ type: "unit" }>
	export type Iri = Readonly<{ type: "iri" }>
	export type Literal = Readonly<{ type: "literal"; datatype: string }>
	export type Product = Readonly<{ type: "product"; components: Component[] }>
	export type Component = Readonly<{
		type: "component"
		key: string
		value: Type
	}>
	export type Coproduct = Readonly<{ type: "coproduct"; options: Option[] }>
	export type Option = Readonly<{ type: "option"; key: string; value: Type }>

	export type Instance = Value[][]

	export type Value =
		| N3.BlankNode
		| N3.NamedNode
		| N3.Literal
		| Record
		| Variant
		| Pointer

	export class Pointer {
		constructor(readonly index: number) {
			Object.freeze(this)
		}
		public get termType(): "Pointer" {
			return "Pointer"
		}
	}

	export class Record extends Array<Value> {
		constructor(
			readonly node: N3.BlankNode,
			readonly componentKeys: string[],
			values: Iterable<Value>
		) {
			super(...values)
			Object.freeze(this)
		}
		public get termType(): "Record" {
			return "Record"
		}
		public get(key: string): Value {
			const index = this.componentKeys.indexOf(key)
			if (index === -1) {
				throw new Error("Key not found")
			} else {
				return this[index]
			}
		}
	}

	export class Variant {
		constructor(
			readonly node: N3.BlankNode,
			readonly optionKeys: string[],
			readonly index: number,
			readonly value: Value
		) {
			Object.freeze(this)
		}
		public get termType(): "Variant" {
			return "Variant"
		}
		public get key(): string {
			return this.optionKeys[this.index]
		}
	}

	export type Morphism =
		| Identity
		| Composition
		| Projection
		| Injection
		| Tuple
		| Case
		| Constant

	export type Identity = Readonly<{ type: "identity" }>
	export type Composition = Readonly<{
		type: "composition"
		object: APG.Type
		morphisms: [Morphism, Morphism]
	}>
	export type Projection = Readonly<{ type: "projection"; index: number }>
	export type Injection = Readonly<{ type: "injection"; index: number }>
	export type Tuple = Readonly<{ type: "tuple"; morphisms: Morphism[] }>
	export type Case = Readonly<{ type: "case"; morphisms: Morphism[] }>
	export type Constant = Readonly<{
		type: "constant"
		value: N3.BlankNode | N3.NamedNode | N3.Literal
	}>

	export function validateValue(
		value: Value,
		type: Type,
		schema: Schema
	): boolean {
		if (type.type === "reference") {
			const label = schema[type.value]
			return validateValue(value, label.value, schema)
		} else if (type.type === "unit") {
			return value.termType === "BlankNode"
		} else if (type.type === "iri") {
			return value.termType === "NamedNode"
		} else if (type.type === "literal") {
			return (
				value.termType === "Literal" && value.datatype.value === type.datatype
			)
		} else if (type.type === "product") {
			if (
				value.termType === "Record" &&
				value.length === type.components.length
			) {
				const iter = zip3(value.componentKeys, value, type.components)
				for (const [k, v, { key, value }] of iter) {
					if (k === key && validateValue(v, value, schema)) {
						continue
					} else {
						return false
					}
				}
				return true
			} else {
				return false
			}
		} else if (type.type === "coproduct") {
			if (value.termType === "Variant" && value.index < type.options.length) {
				const option = type.options[value.index]
				return validateValue(value.value, option.value, schema)
			} else {
				return false
			}
		} else {
			signalInvalidType(type)
		}
	}

	export function validateMorphism(
		morphism: APG.Morphism,
		source: APG.Type,
		target: APG.Type,
		schema: APG.Schema
	): boolean {
		if (morphism.type === "constant") {
			return APG.validateValue(morphism.value, target, schema)
		} else if (morphism.type === "identity") {
			return equal(source, target)
		} else if (morphism.type === "composition") {
			const [AB, BC] = morphism.morphisms
			return (
				validateMorphism(AB, source, morphism.object, schema) &&
				validateMorphism(BC, morphism.object, target, schema)
			)
		} else if (morphism.type === "projection") {
			if (source.type !== "product") {
				return false
			} else if (morphism.index >= source.components.length) {
				return false
			}
			const { value } = source.components[morphism.index]
			return equal(value, target)
		} else if (morphism.type === "injection") {
			if (target.type !== "coproduct") {
				return false
			} else if (morphism.index >= target.options.length) {
				return false
			}
			const { value } = target.options[morphism.index]
			return equal(source, value)
		} else if (morphism.type === "tuple") {
			if (target.type !== "product") {
				return false
			} else if (morphism.morphisms.length !== target.components.length) {
				return false
			}
			for (const [m, c] of zip(morphism.morphisms, target.components)) {
				if (validateMorphism(m, source, c.value, schema)) {
					continue
				} else {
					return false
				}
			}
			return true
		} else if (morphism.type === "case") {
			if (source.type !== "coproduct") {
				return false
			} else if (morphism.morphisms.length !== source.options.length) {
				return false
			}
			for (const [m, o] of zip(morphism.morphisms, source.options)) {
				if (validateMorphism(m, o.value, target, schema)) {
					continue
				} else {
					return false
				}
			}
			return true
		} else {
			throw new Error("Invalid morphism")
		}
	}

	export const toId = (id: string) => `_:${id}` as t.TypeOf<typeof blankNodeId>

	function makeValue(
		type: Unit | Iri | Literal | Product | Coproduct,
		graph: t.TypeOf<typeof codec>,
		schema: Schema,
		typeIds: Map<Type, t.Branded<string, ID>>
	): t.Branded<string, ID> {
		if (type.type === "unit") {
			const id = toId(`t-${graph.length}`)
			graph.push({ id, type: "unit" })
			typeIds.set(type, id)
			return id
		} else if (type.type === "iri") {
			const id = toId(`t-${graph.length}`)
			graph.push({ id, type: "iri" })
			typeIds.set(type, id)
			return id
		} else if (type.type === "literal") {
			const id = toId(`t-${graph.length}`)
			graph.push({ id, type: "literal", datatype: type.datatype })
			typeIds.set(type, id)
			return id
		} else if (type.type === "product") {
			const componentValues: t.TypeOf<
				typeof value
			>[] = type.components.map(({ value }) =>
				getValue(value, graph, schema, typeIds)
			)

			const components: t.TypeOf<typeof component>[] = []
			for (const [{ key }, value, i] of zip(type.components, componentValues)) {
				const id = toId(`t-${graph.length}-${i}`)
				components.push({ id, type: "component", key, value })
			}

			const id = toId(`t-${graph.length}`)
			graph.push({ id, type: "product", components })
			typeIds.set(type, id)
			return id
		} else if (type.type === "coproduct") {
			const optionValues: t.TypeOf<
				typeof value
			>[] = type.options.map(({ value }) =>
				getValue(value, graph, schema, typeIds)
			)

			const options: t.TypeOf<typeof option>[] = []
			for (const [{ key }, value, i] of zip(type.options, optionValues)) {
				const id = toId(`t-${graph.length}-${i}`)
				options.push({ id, type: "option", key, value })
			}

			const id = toId(`t-${graph.length}`)
			graph.push({ id, type: "coproduct", options })
			typeIds.set(type, id)
			return id
		} else {
			throw new Error("Invalid value")
		}
	}

	function getValue(
		type: Type,
		graph: t.TypeOf<typeof codec>,
		schema: Schema,
		typeIds: Map<Type, t.Branded<string, ID>>
	): t.TypeOf<typeof value> {
		if (type.type === "reference") {
			const value = toId(`l-${type.value}`)
			return { reference: { type: "reference", value } }
		}

		const id = typeIds.has(type)
			? typeIds.get(type)!
			: makeValue(type, graph, schema, typeIds)

		if (type.type === "unit") {
			return { unit: id }
		} else if (type.type === "iri") {
			return { iri: id }
		} else if (type.type === "literal") {
			return { literal: id }
		} else if (type.type === "product") {
			return { product: id }
		} else if (type.type === "coproduct") {
			return { coproduct: id }
		} else {
			signalInvalidType(type)
		}
	}

	export function toJSON(schema: Schema): t.TypeOf<typeof codec> {
		const typeIds: Map<Type, t.Branded<string, ID>> = new Map()
		const graph: t.TypeOf<typeof codec> = []
		const values = schema.map(({ value }) =>
			getValue(value, graph, schema, typeIds)
		)
		for (const [{ key }, value, index] of zip(schema, values)) {
			const id = toId(`l-${index}`)
			graph.push({ id, type: "label", key, value })
		}

		return graph
	}

	const idPattern = /^_:[a-z][a-zA-Z0-9-]*$/

	interface ID {
		readonly ID: unique symbol
	}

	const blankNodeId = t.brand(
		t.string,
		(string): string is t.Branded<string, ID> => idPattern.test(string),
		"ID"
	)

	const reference = t.type({ type: t.literal("reference"), value: blankNodeId })

	const referenceValue = t.type({ reference: reference })
	const value = t.union([
		t.type({ unit: blankNodeId }),
		t.type({ iri: blankNodeId }),
		t.type({ literal: blankNodeId }),
		t.type({ product: blankNodeId }),
		t.type({ coproduct: blankNodeId }),
		referenceValue,
	])

	const label = t.type({
		id: blankNodeId,
		type: t.literal("label"),
		key: t.string,
		value,
	})

	const unit = t.type({ id: blankNodeId, type: t.literal("unit") })
	const iri = t.type({ id: blankNodeId, type: t.literal("iri") })

	const literal = t.union([
		t.type({ id: blankNodeId, type: t.literal("literal"), datatype: t.string }),
		t.type({
			id: blankNodeId,
			type: t.literal("literal"),
			datatype: t.string,
			pattern: t.string,
			flags: t.string,
		}),
	])

	const component = t.type({
		id: blankNodeId,
		type: t.literal("component"),
		key: t.string,
		value,
	})

	const product = t.type({
		id: blankNodeId,
		type: t.literal("product"),
		components: t.array(component),
	})

	const option = t.type({
		id: blankNodeId,
		type: t.literal("option"),
		key: t.string,
		value,
	})

	const coproduct = t.type({
		id: blankNodeId,
		type: t.literal("coproduct"),
		options: t.array(option),
	})

	const schema = t.array(
		t.union([label, unit, iri, literal, product, coproduct])
	)

	const isReference = (
		reference: t.TypeOf<typeof value>
	): reference is t.TypeOf<typeof referenceValue> =>
		reference.hasOwnProperty("reference")

	const getID = (
		reference: Exclude<t.TypeOf<typeof value>, t.TypeOf<typeof referenceValue>>
	): t.Branded<string, ID> => {
		const [type] = Object.keys(reference)
		const ref = reference as { [key: string]: t.Branded<string, ID> }
		return ref[type]
	}

	export const codec = new t.Type(
		"Schema",
		schema.is,
		(input: unknown, context: t.Context) => {
			const result = schema.validate(input, context)
			if (result._tag === "Left") {
				return result
			}
			const labels: Set<t.Branded<string, ID>> = new Set()
			const types: Map<t.Branded<string, ID>, Type["type"]> = new Map()
			for (const value of result.right) {
				if (value.type === "label") {
					labels.add(value.id)
				} else {
					types.set(value.id, value.type)
				}
			}
			for (const value of result.right) {
				if (value.type === "label") {
					if (isReference(value.value)) {
						if (labels.has(value.value.reference.value)) {
							continue
						} else {
							const message = `Invalid label alias: ${value.value}`
							return {
								_tag: "Left",
								left: [{ value: input, context, message }],
							}
						}
					} else {
						const id = getID(value.value)
						if (types.has(id)) {
							continue
						} else {
							const message = `Invalid label value: ${id}`
							return {
								_tag: "Left",
								left: [{ value: input, context, message }],
							}
						}
					}
				} else if (value.type === "product") {
					for (const component of value.components) {
						if (isReference(component.value)) {
							if (labels.has(component.value.reference.value)) {
								continue
							} else {
								const message = `Invalid label reference: ${component.value.reference.value}`
								const error = { value: input, context, message }
								return { _tag: "Left", left: [error] }
							}
						} else {
							const id = getID(component.value)
							if (types.has(id)) {
								continue
							} else {
								const message = `Invalid type: ${id}`
								const error = { value: input, context, message }
								return { _tag: "Left", left: [error] }
							}
						}
					}
				} else if (value.type === "coproduct") {
					for (const option of value.options) {
						if (isReference(option.value)) {
							if (labels.has(option.value.reference.value)) {
								continue
							} else {
								const message = `Invalid label reference: ${option.value.reference.value}`
								const error = { value: input, context, message }
								return { _tag: "Left", left: [error] }
							}
						} else {
							const id = getID(option.value)
							if (types.has(id)) {
								continue
							} else {
								const message = `Invalid type: ${id}`
								const error = { value: input, context, message }
								return { _tag: "Left", left: [error] }
							}
						}
					}
				}
			}
			return result
		},
		(values): APG.Schema => {
			const labels: Map<
				t.Branded<string, ID>,
				t.TypeOf<typeof label>
			> = new Map()
			const types: Map<
				t.Branded<string, ID>,
				| t.TypeOf<typeof unit>
				| t.TypeOf<typeof iri>
				| t.TypeOf<typeof literal>
				| t.TypeOf<typeof product>
				| t.TypeOf<typeof coproduct>
			> = new Map()
			for (const value of values) {
				if (value.type === "label") {
					labels.set(value.id, value)
				} else {
					types.set(value.id, value)
				}
			}

			const labelArray = Array.from(labels).sort(sortKeys)
			const labelIds: Map<t.Branded<string, ID>, number> = new Map(
				labelArray.map(([id], index) => [id, index])
			)

			const typeCache: Map<
				t.Branded<string, ID>,
				Unit | Iri | Literal | Product | Coproduct
			> = new Map()

			const schema: Schema = labelArray.map(([{}, { key, value }]) =>
				Object.freeze({
					type: "label",
					key,
					value: cacheValue(value, types, typeCache, labelIds),
				})
			)
			Object.freeze(schema)
			return schema
		}
	)

	function cacheValue(
		reference: t.TypeOf<typeof value>,
		types: Map<
			t.Branded<string, ID>,
			| t.TypeOf<typeof unit>
			| t.TypeOf<typeof iri>
			| t.TypeOf<typeof literal>
			| t.TypeOf<typeof product>
			| t.TypeOf<typeof coproduct>
		>,
		typeCache: Map<
			t.Branded<string, ID>,
			Unit | Iri | Literal | Product | Coproduct
		>,
		labelIds: Map<t.Branded<string, ID>, number>
	): Type {
		if (isReference(reference)) {
			const labelId = reference.reference.value
			const index = labelIds.get(labelId)
			if (index === undefined) {
				throw new Error(`Cannot find label ${labelId}`)
			}

			return Object.freeze({ type: "reference", value: index })
		} else {
			const id = getID(reference)
			return cacheType(id, types, typeCache, labelIds)
		}
	}

	function cacheType(
		id: t.Branded<string, ID>,
		types: Map<
			t.Branded<string, ID>,
			| t.TypeOf<typeof unit>
			| t.TypeOf<typeof iri>
			| t.TypeOf<typeof literal>
			| t.TypeOf<typeof product>
			| t.TypeOf<typeof coproduct>
		>,
		typeCache: Map<
			t.Branded<string, ID>,
			Unit | Iri | Literal | Product | Coproduct
		>,
		labelIds: Map<t.Branded<string, ID>, number>
	): Unit | Iri | Literal | Product | Coproduct {
		const cached = typeCache.get(id)
		if (cached !== undefined) {
			return cached
		}

		const type = types.get(id)!
		if (type.type === "unit") {
			const unit: Unit = Object.freeze({ type: "unit" })
			typeCache.set(id, unit)
			return unit
		} else if (type.type === "iri") {
			const iri: Iri = Object.freeze({ type: "iri" })
			typeCache.set(id, iri)
			return iri
		} else if (type.type === "literal") {
			const literal: Literal = Object.freeze({
				type: "literal",
				datatype: type.datatype,
			})
			typeCache.set(id, literal)
			return literal
		} else if (type.type === "product") {
			const entries: [
				string,
				t.TypeOf<typeof component>
			][] = type.components.map((component) => [component.id, component])
			entries.sort(sortKeys)
			const components: Component[] = entries.map(([{}, { key, value }]) =>
				Object.freeze({
					type: "component",
					key,
					value: cacheValue(value, types, typeCache, labelIds),
				})
			)
			Object.freeze(
				components.sort(({ key: a }, { key: b }) =>
					a < b ? -1 : b < a ? 1 : 0
				)
			)
			const product: Product = Object.freeze({ type: "product", components })
			typeCache.set(id, product)
			return product
		} else if (type.type === "coproduct") {
			const entries: [
				string,
				t.TypeOf<typeof option>
			][] = type.options.map((option) => [option.id, option])
			entries.sort(sortKeys)
			const options: Option[] = entries.map(([{}, { key, value }]) =>
				Object.freeze({
					type: "option",
					key,
					value: cacheValue(value, types, typeCache, labelIds),
				})
			)
			Object.freeze(
				options.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0))
			)
			const coproduct: Coproduct = Object.freeze({ type: "coproduct", options })
			typeCache.set(id, coproduct)
			return coproduct
		} else {
			signalInvalidType(type)
		}
	}
}

export default APG
