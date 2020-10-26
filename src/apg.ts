import * as t from "io-ts"
import * as N3 from "n3.ts"

import { equal, forType, signalInvalidType, zip } from "./utils.js"

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
				const iter = zip(value.componentKeys, value, type.components)
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

	export const reference: t.Type<APG.Reference> = t.type({
		type: t.literal("reference"),
		value: t.number,
	})

	export const unit: t.Type<APG.Unit> = t.type({ type: t.literal("unit") })

	export const iri: t.Type<APG.Iri> = t.type({ type: t.literal("iri") })

	export const literal: t.Type<APG.Literal> = t.type({
		type: t.literal("literal"),
		datatype: t.string,
	})

	export const product: t.Type<APG.Product> = t.recursion("Product", () =>
		t.type({
			type: t.literal("product"),
			components: t.array(component),
		})
	)

	export const coproduct: t.Type<APG.Coproduct> = t.recursion("Coproduct", () =>
		t.type({
			type: t.literal("coproduct"),
			options: t.array(option),
		})
	)

	export const type: t.Type<Type> = t.recursion("Type", () =>
		t.union([reference, unit, iri, literal, product, coproduct])
	)

	export const component: t.Type<APG.Component> = t.type({
		type: t.literal("component"),
		key: t.string,
		value: type,
	})

	export const option: t.Type<APG.Option> = t.type({
		type: t.literal("option"),
		key: t.string,
		value: type,
	})

	export const label = t.type({
		type: t.literal("label"),
		key: t.string,
		value: type,
	})

	const labels = t.array(label)

	export const schema: t.Type<APG.Schema> = new t.Type(
		"Schema",
		labels.is,
		(input: unknown, context: t.Context) => {
			const result = labels.validate(input, context)
			if (result._tag === "Left") {
				return result
			}

			// Check that the label keys are sorted
			// (this also checks for duplicates)
			if (isSorted(result.right) === false) {
				return t.failure(result.right, context, "Labels must be sorted by key")
			}

			// Check that all the components and options are sorted,
			// and that references have valid indices
			for (const label of result.right) {
				for (const [type] of forType(label.value)) {
					if (type.type === "reference") {
						if (result.right[type.value] === undefined) {
							return t.failure(type, context, "Invalid reference index")
						}
					} else if (type.type === "product") {
						if (isSorted(type.components) === false) {
							return t.failure(
								type,
								context,
								"Product components must be sorted by key"
							)
						}
					} else if (type.type === "coproduct") {
						if (isSorted(type.options) === false) {
							return t.failure(
								type,
								context,
								"Coproduct options must be sorted by key"
							)
						}
					}
				}
			}

			return result
		},
		t.identity
	)

	function isSorted(keys: { key: string }[]): boolean {
		const result = keys.reduce((previous: string | null, { key }) => {
			if (previous === null) {
				return null
			} else if (previous < key) {
				return key
			} else {
				return null
			}
		}, "")
		return result !== null
	}
}

export default APG
