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

	const schema: APG.Schema = new Map()

	const labels = database.right.get("_:label") as APG.LabelValue[]
	for (const { value: labelValue } of labels) {
		const {
			node: { id },
			components: [keyValue, valueValue],
		} = labelValue as APG.ProductValue
		const {
			node: { value: key },
		} = keyValue as APG.IriValue
		const value = parseReference(valueValue as APG.CoproductValue)
		schema.set(id, { id, type: "label", key, value: value.id })
	}

	const units = database.right.get("_:unit") as APG.LabelValue[]
	for (const { value: labelValue } of units as APG.LabelValue[]) {
		const {
			node: { id },
		} = labelValue as APG.UnitValue
		const unit: APG.Unit = { id, type: "unit" }
		schema.set(id, unit)
	}

	const iris = database.right.get("_:iri") as APG.LabelValue[]
	for (const { value: labelValue } of iris as APG.LabelValue[]) {
		const { option, value: optionValue } = labelValue as APG.CoproductValue
		if (option === "_:iri-option-unit" && optionValue.type === "unit") {
			const {
				node: { id },
			} = optionValue
			schema.set(id, { id, type: "iri" })
		} else if (
			option === "_:iri-option-product" &&
			optionValue.type === "product"
		) {
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

	const literals = database.right.get("_:literal") as APG.LabelValue[]
	for (const { value: labelValue } of literals as APG.LabelValue[]) {
		const { option, value: optionValue } = labelValue as APG.CoproductValue
		if (
			option === "_:literal-option-datatype" &&
			optionValue.type === "product"
		) {
			const {
				node: { id },
				components: [datatypeValue],
			} = optionValue as APG.ProductValue
			const {
				node: { value: datatype },
			} = datatypeValue as APG.IriValue
			schema.set(id, { id, type: "literal", datatype })
		} else if (
			option === "_:literal-option-pattern" &&
			optionValue.type === "product"
		) {
			const {
				node: { id },
				components: [datatypeValue, patternValue, flagsValue],
			} = optionValue as APG.ProductValue
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

	const products = database.right.get("_:product") as APG.LabelValue[]
	for (const { value: labelValue } of products as APG.LabelValue[]) {
		const {
			node: { id },
		} = labelValue as APG.UnitValue
		schema.set(id, { id, type: "product", components: [] })
	}

	const coproducts = database.right.get("_:coproduct") as APG.LabelValue[]
	for (const { value: labelValue } of coproducts as APG.LabelValue[]) {
		const {
			node: { id },
		} = labelValue as APG.UnitValue
		schema.set(id, { id, type: "coproduct", options: [] })
	}

	const components = database.right.get("_:component") as APG.LabelValue[]
	for (const { value: labelValue } of components as APG.LabelValue[]) {
		const {
			components: [sourceValue, keyValue, valueValue],
		} = labelValue as APG.ProductValue
		const { value: sourceLabelValue } = sourceValue as APG.LabelValue
		const {
			node: { id },
		} = sourceLabelValue as APG.UnitValue
		const {
			node: { value: key },
		} = keyValue as APG.IriValue
		const { id: value } = parseReference(valueValue as APG.CoproductValue)
		const product = schema.get(id) as APG.Product
		product.components.push({ type: "component", key, value })
	}

	const options = database.right.get("_:option") as APG.LabelValue[]
	for (const { value: labelValue } of options as APG.LabelValue[]) {
		const {
			components: [sourceValue, valueValue],
		} = labelValue as APG.ProductValue
		const { value: sourceLabelValue } = sourceValue as APG.LabelValue
		const {
			node: { id },
		} = sourceLabelValue as APG.UnitValue
		const { id: value } = parseReference(valueValue as APG.CoproductValue)
		const coproduct = schema.get(id) as APG.Coproduct
		coproduct.options.push({ type: "option", value })
	}

	return { _tag: "Right", right: schema }
}

function parseReference(coproduct: APG.CoproductValue): BlankNode {
	const { value } = coproduct.value as APG.LabelValue
	if (coproduct.option === "_:unit") {
		const { node } = value as APG.UnitValue
		return node
	} else if (coproduct.option === "_:label") {
		const { node } = value as APG.ProductValue
		return node
	} else if (coproduct.option === "_:iri") {
		const { option, value: optionValue } = value as APG.CoproductValue
		if (option === "_:iri-option-unit") {
			const { node } = optionValue as APG.UnitValue
			return node
		} else if (option === "_:iri-option-product") {
			const { node } = optionValue as APG.ProductValue
			return node
		} else {
			throw new Error("Invalid iri value option")
		}
	} else if (coproduct.option === "_:literal") {
		const { option, value: optionValue } = value as APG.CoproductValue
		if (option === "_:literal-option-datatype") {
			const { node } = optionValue as APG.ProductValue
			return node
		} else if (option === "_:literal-option-pattern") {
			const { node } = optionValue as APG.ProductValue
			return node
		} else {
			throw new Error("Invalid literal value option")
		}
	} else if (coproduct.option === "_:product") {
		const { node } = value as APG.UnitValue
		return node
	} else if (coproduct.option === "_:coproduct") {
		const { node } = value as APG.UnitValue
		return node
	} else {
		throw new Error("Invalid value option")
	}
}
