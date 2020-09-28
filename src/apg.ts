import t from "io-ts"
import N3 from "n3.ts"

import { equal, zip } from "./utils.js"

type pattern = { pattern: string; flags: string }
type iri = { type: "iri" }
type patternIri = iri & pattern
type literal = { type: "literal"; datatype: string }
type patternLiteral = literal & pattern

namespace APG {
	export type Schema = Readonly<{
		labels: Map<string, Label>
		types: Map<string, Type>
	}>

	export type Label = Readonly<{
		type: "label"
		key: string
		value: string | Reference
	}>
	export type Type = Unit | Iri | Literal | Product | Coproduct
	export type Reference = Readonly<{ type: "reference"; value: string }>
	export type Unit = Readonly<{ type: "unit" }>
	export type Iri = iri | patternIri
	export type Literal = Readonly<literal | patternLiteral>
	export type Product = Readonly<{
		type: "product"
		components: Map<string, Component>
	}>
	export type Component = Readonly<{
		type: "component"
		key: string
		value: string | Reference
	}>
	export type Coproduct = Readonly<{
		type: "coproduct"
		options: Map<string, Option>
	}>
	export type Option = Readonly<{ type: "option"; value: string | Reference }>

	export type Instance = Map<string, Set<Value>>
	export type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Tree
	export class Tree<C extends Value = Value> implements Iterable<[string, C]> {
		readonly children: Map<string, C>
		constructor(readonly node: N3.BlankNode, children: Iterable<[string, C]>) {
			this.children = new Map(children)
		}
		public [Symbol.iterator]() {
			return this.children.entries()
		}
		public keys(): Iterable<string> {
			return this.children.keys()
		}
		public values(): Iterable<C> {
			return this.children.values()
		}
		public entries(): Iterable<[string, C]> {
			return this.children.entries()
		}
		public get termType(): "Tree" {
			return "Tree"
		}
		public get size() {
			return this.children.size
		}
		public get(component: string) {
			return this.children.get(component)
		}
	}

	export type Morphism =
		| Identity
		| Composition
		| Projection
		| Injection
		| Tuple
		| Case
	export type Identity = Readonly<{ type: "identity" }>
	export type Composition = Readonly<{
		type: "composition"
		objects: [string, string, string]
		morphisms: [Morphism, Morphism]
	}>
	export type Projection = Readonly<{ type: "projection"; component: string }>
	export type Injection = Readonly<{ type: "injection"; option: string }>
	export type Tuple = Readonly<{
		type: "tuple"
		morphisms: Map<string, Morphism>
	}>
	export type Case = Readonly<{
		type: "case"
		morphisms: Map<string, Morphism>
	}>

	export const toId = (id: string) => `_:${id}` as t.TypeOf<typeof blankNodeId>
	export const toValue = (id: string | Reference): t.TypeOf<typeof value> =>
		typeof id === "string"
			? toId(id)
			: { type: "reference", value: toId(id.value) }

	export function toJSON(schema: Schema): t.TypeOf<typeof codec> {
		const graph: t.TypeOf<typeof codec> = []
		for (const [id, label] of schema.labels) {
			graph.push({
				id: toId(id),
				type: "label",
				key: label.key,
				value: toValue(label.value),
			})
		}
		for (const [id, type] of schema.types) {
			if (type.type === "unit") {
				graph.push({ id: toId(id), type: "unit" })
			} else if (type.type === "iri") {
				graph.push({ id: toId(id), type: "iri" })
			} else if (type.type === "literal") {
				graph.push({ id: toId(id), ...type })
			} else if (type.type === "product") {
				const components: t.TypeOf<typeof component>[] = []
				for (const [id, { key, value }] of type.components) {
					components.push({
						id: toId(id),
						type: "component",
						key,
						value: toValue(value),
					})
				}
				graph.push({ id: toId(id), type: "product", components })
			} else if (type.type === "coproduct") {
				const options: t.TypeOf<typeof option>[] = []
				for (const [id, { value }] of type.options) {
					options.push({
						id: toId(id),
						type: "option",
						value: toValue(value),
					})
				}
				graph.push({ id: toId(id), type: "coproduct", options })
			}
		}
		return graph
	}

	export const iriHasPattern = (
		expression: APG.Iri
	): expression is patternIri => expression.hasOwnProperty("pattern")

	export const literalHasPattern = (
		expression: APG.Literal
	): expression is patternLiteral => expression.hasOwnProperty("pattern")

	export function validateMorphism(
		morphism: APG.Morphism,
		source: string | APG.Reference,
		target: string | APG.Reference,
		schema: APG.Schema
	): boolean {
		if (morphism.type === "identity") {
			return equal(source, target)
		} else if (morphism.type === "composition") {
			const [A, B, C] = morphism.objects
			const [AB, BC] = morphism.morphisms
			return (
				A === source &&
				C === target &&
				validateMorphism(AB, A, B, schema) &&
				validateMorphism(BC, B, B, schema)
			)
		} else if (morphism.type === "projection") {
			if (typeof source === "string") {
				const product = schema.types.get(source)
				if (product !== undefined && product.type === "product") {
					const component = product.components.get(morphism.component)
					return component !== undefined && equal(component.value, target)
				} else {
					return false
				}
			} else {
				return false
			}
		} else if (morphism.type === "injection") {
			if (typeof target === "string") {
				const coproduct = schema.types.get(target)
				if (coproduct !== undefined && coproduct.type === "coproduct") {
					const option = coproduct.options.get(morphism.option)
					return option !== undefined && equal(option.value, source)
				} else {
					return false
				}
			} else {
				return false
			}
		} else if (morphism.type === "tuple") {
			if (typeof target === "string") {
				const product = schema.types.get(target)
				if (
					product !== undefined &&
					product.type === "product" &&
					morphism.morphisms.size === product.components.size
				) {
					const iter = zip(morphism.morphisms, product.components)
					for (const [[mId, m], [cId, c]] of iter) {
						if (mId === cId && validateMorphism(m, source, c.value, schema)) {
							continue
						} else {
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
		} else if (morphism.type === "case") {
			if (typeof source === "string") {
				const coproduct = schema.types.get(source)
				if (
					coproduct !== undefined &&
					coproduct.type === "coproduct" &&
					morphism.morphisms.size === coproduct.options.size
				) {
					const iter = zip(morphism.morphisms, coproduct.options)
					for (const [[mId, m], [oId, o]] of iter) {
						if (mId === oId && validateMorphism(m, o.value, target, schema)) {
							continue
						} else {
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
		} else {
			throw new Error("Invalid morphism type")
		}
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

	const value = t.union([blankNodeId, reference])

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
	const isID = (
		reference: t.TypeOf<typeof value>
	): reference is t.TypeOf<typeof blankNodeId> => typeof reference === "string"

	const trimReference = (
		reference: t.TypeOf<typeof value>
	): string | APG.Reference =>
		isID(reference)
			? reference.slice(2)
			: Object.freeze({ type: "reference", value: reference.value.slice(2) })

	export const codec = new t.Type(
		"Schema",
		schema.is,
		(input: unknown, context: t.Context) => {
			const result = schema.validate(input, context)
			if (result._tag === "Left") {
				return result
			}
			const labels: Set<string> = new Set()
			const types: Set<string> = new Set()
			for (const value of result.right) {
				if (value.type === "label") {
					labels.add(value.id)
				} else {
					types.add(value.id)
				}
			}
			for (const value of result.right) {
				if (value.type === "label") {
					if (isID(value.value)) {
						if (types.has(value.value)) {
							continue
						} else {
							const message = `Invalid label value: ${value.value}`
							return {
								_tag: "Left",
								left: [{ value: input, context, message }],
							}
						}
					} else {
						if (labels.has(value.value.value)) {
							continue
						} else {
							const message = `Invalid label alias: ${value.value}`
							return {
								_tag: "Left",
								left: [{ value: input, context, message }],
							}
						}
					}
				} else if (value.type === "product") {
					for (const component of value.components) {
						if (isID(component.value)) {
							if (types.has(component.value)) {
								continue
							} else {
								const message = `Invalid type: ${component.value}`
								const error = { value: input, context, message }
								return { _tag: "Left", left: [error] }
							}
						} else {
							if (labels.has(component.value.value)) {
								continue
							} else {
								const message = `Invalid label reference: ${component.value.value}`
								const error = { value: input, context, message }
								return { _tag: "Left", left: [error] }
							}
						}
					}
				} else if (value.type === "coproduct") {
					for (const option of value.options) {
						if (isID(option.value)) {
							if (types.has(option.value)) {
								continue
							} else {
								const message = `Invalid type: ${option.value}`
								const error = { value: input, context, message }
								return { _tag: "Left", left: [error] }
							}
						} else {
							if (labels.has(option.value.value)) {
								continue
							} else {
								const message = `Invalid label reference: ${option.value.value}`
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
			const labels: Map<string, APG.Label> = new Map()
			const types: Map<string, APG.Type> = new Map()
			for (const { id, ...value } of values) {
				const name = id.slice(2)
				if (value.type === "label") {
					labels.set(
						name,
						Object.freeze({
							type: "label",
							key: value.key,
							value: trimReference(value.value),
						})
					)
				} else if (value.type === "product") {
					const components = new Map(
						value.components.map((component): [string, APG.Component] => {
							const id = component.id.slice(2)
							const value = trimReference(component.value)
							return [
								id,
								Object.freeze({ type: "component", key: component.key, value }),
							]
						})
					)
					types.set(name, { type: "product", components })
				} else if (value.type === "coproduct") {
					const options = new Map(
						value.options.map((option): [string, APG.Option] => {
							const id = option.id.slice(2)
							const value = trimReference(option.value)
							return [id, Object.freeze({ type: "option", value })]
						})
					)
					types.set(name, Object.freeze({ type: "coproduct", options }))
				} else {
					types.set(name, Object.freeze({ ...value }))
				}
			}
			return Object.freeze({ labels, types })
		}
	)
}

export default APG
