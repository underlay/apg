import { Store, Parse, BlankNode } from "n3.ts"

import { Either } from "fp-ts/Either"

import { FailureResult } from "@shexjs/validator"

import { APG } from "./apg.js"

import { parse } from "./shex.js"

export const ns = {
	label: "http://underlay.org/ns/label",
	unit: "http://underlay.org/ns/unit",
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

export function parseSchemaString(
	input: string,
	schemaSchema: APG.Schema
): Either<FailureResult, APG.Schema> {
	const store = new Store(Parse(input))
	return parseSchema(store, schemaSchema)
}

export function parseSchema(
	store: Store,
	schemaSchema: APG.Schema
): Either<FailureResult, APG.Schema> {
	const database = parse(store, schemaSchema)
	if (database._tag === "Left") {
		return database
	}

	// types is indexed by iri key, not blank node label
	const dictionary: Map<string, string> = new Map()
	const types: APG.Instance = new Map()
	for (const type of schemaSchema.values()) {
		if (type.type === "label") {
			const values = database.right.get(type.id)
			if (values === undefined) {
				throw new Error(`Cannot find ${type.id} in database`)
			}
			types.set(type.key, values)
			dictionary.set(type.key, type.id)
		}
	}

	const schema: APG.Schema = new Map()

	const labels = types.get(ns.label) as APG.LabelValue[]
	for (const { value: labelValue } of labels) {
		const {
			node: { id },
			components: [keyValue, valueValue],
		} = labelValue as APG.ProductValue
		const {
			node: { value: key },
		} = keyValue as APG.IriValue
		const value = parseReference(valueValue as APG.CoproductValue, dictionary)
		schema.set(id, { id, type: "label", key, value: value.id })
	}

	const units = types.get(ns.unit) as APG.LabelValue[]
	for (const { value: labelValue } of units) {
		const {
			node: { id },
		} = labelValue as APG.UnitValue
		const unit: APG.Unit = { id, type: "unit" }
		schema.set(id, unit)
	}

	const iris = types.get(ns.iri) as APG.LabelValue[]
	for (const { value: labelValue } of iris) {
		const { value: optionValue } = labelValue as APG.CoproductValue
		if (optionValue.type === "unit") {
			const {
				node: { id },
			} = optionValue
			schema.set(id, { id, type: "iri" })
		} else if (optionValue.type === "product") {
			const {
				node: { id },
				components: [patternValue, flagsValue],
			} = optionValue as APG.ProductValue
			const {
				node: { value: pattern },
			} = patternValue as APG.LiteralValue
			const {
				node: { value: flags },
			} = flagsValue as APG.LiteralValue
			schema.set(id, { id, type: "iri", pattern, flags })
		} else {
			throw new Error("Invalid iri value")
		}
	}

	const literals = types.get(ns.literal) as APG.LabelValue[]
	for (const { value: labelValue } of literals as APG.LabelValue[]) {
		const { value: optionValue } = labelValue as APG.CoproductValue
		if (optionValue.type === "product" && optionValue.components.length === 1) {
			const {
				node: { id },
				components: [datatypeValue],
			} = optionValue
			const {
				node: { value: datatype },
			} = datatypeValue as APG.IriValue
			schema.set(id, { id, type: "literal", datatype })
		} else if (
			optionValue.type === "product" &&
			optionValue.components.length === 3
		) {
			const {
				node: { id },
				components: [datatypeValue, patternValue, flagsValue],
			} = optionValue
			const {
				node: { value: datatype },
			} = datatypeValue as APG.IriValue
			const {
				node: { value: pattern },
			} = patternValue as APG.LiteralValue
			const {
				node: { value: flags },
			} = flagsValue as APG.LiteralValue
			schema.set(id, { id, type: "literal", datatype, pattern, flags })
		}
	}

	const products = types.get(ns.product) as APG.LabelValue[]
	for (const { value: labelValue } of products) {
		const {
			node: { id },
		} = labelValue as APG.UnitValue
		schema.set(id, { id, type: "product", components: [] })
	}

	const coproducts = types.get(ns.coproduct) as APG.LabelValue[]
	for (const { value: labelValue } of coproducts) {
		const {
			node: { id },
		} = labelValue as APG.UnitValue
		schema.set(id, { id, type: "coproduct", options: [] })
	}

	const components = types.get(ns.component) as APG.LabelValue[]
	for (const { value: labelValue } of components) {
		const {
			node: { id: componentId },
			components: [sourceValue, keyValue, valueValue],
		} = labelValue as APG.ProductValue
		const { value: sourceLabelValue } = sourceValue as APG.LabelValue
		const {
			node: { id: valueId },
		} = sourceLabelValue as APG.UnitValue
		const {
			node: { value: key },
		} = keyValue as APG.IriValue
		const { id: value } = parseReference(
			valueValue as APG.CoproductValue,
			dictionary
		)
		const product = schema.get(valueId) as APG.Product
		product.components.push({ id: componentId, type: "component", key, value })
	}

	const options = types.get(ns.option) as APG.LabelValue[]
	for (const { value: labelValue } of options) {
		const {
			node: { id: optionId },
			components: [sourceValue, valueValue],
		} = labelValue as APG.ProductValue
		const { value: sourceLabelValue } = sourceValue as APG.LabelValue
		const {
			node: { id: valueId },
		} = sourceLabelValue as APG.UnitValue
		const { id: value } = parseReference(
			valueValue as APG.CoproductValue,
			dictionary
		)
		const coproduct = schema.get(valueId) as APG.Coproduct
		coproduct.options.push({ id: optionId, type: "option", value })
	}

	return { _tag: "Right", right: schema }
}

function parseReference(
	coproduct: APG.CoproductValue,
	dictionary: Map<string, string>
): BlankNode {
	const { value } = coproduct.value as APG.LabelValue
	if (coproduct.value.id === dictionary.get(ns.unit)) {
		const { node } = value as APG.UnitValue
		return node
	} else if (coproduct.value.id === dictionary.get(ns.label)) {
		const { node } = value as APG.ProductValue
		return node
	} else if (coproduct.value.id === dictionary.get(ns.iri)) {
		const { value: optionValue } = value as APG.CoproductValue
		if (optionValue.type === "unit") {
			return optionValue.node
		} else if (optionValue.type === "product") {
			return optionValue.node
		} else {
			throw new Error("Invalid iri value option")
		}
	} else if (coproduct.value.id === dictionary.get(ns.literal)) {
		const { value: optionValue } = value as APG.CoproductValue
		if (optionValue.type === "product") {
			return optionValue.node
		} else {
			throw new Error("Invalid literal value option")
		}
	} else if (coproduct.value.id === dictionary.get(ns.product)) {
		const { node } = value as APG.UnitValue
		return node
	} else if (coproduct.value.id === dictionary.get(ns.coproduct)) {
		const { node } = value as APG.UnitValue
		return node
	} else {
		throw new Error("Invalid value option")
	}
}
