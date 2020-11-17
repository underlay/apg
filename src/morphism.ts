import zip from "ziterable"
import APG from "./apg.js"

import { typeEqual } from "./type.js"
import { signalInvalidType } from "./utils.js"
import { validateValue } from "./value.js"

export function apply(
	schema: APG.Schema,
	source: APG.Type,
	morphism: APG.Morphism
): APG.Type {
	if (morphism.type === "constant") {
		if (morphism.value.termType === "NamedNode") {
			return Object.freeze({ type: "iri" })
		} else if (morphism.value.termType === "Literal") {
			return Object.freeze({
				type: "literal",
				datatype: morphism.value.datatype.value,
			})
		} else {
			signalInvalidType(morphism.value)
		}
	} else if (morphism.type === "identity") {
		return source
	} else if (morphism.type === "dereference") {
		if (source.type === "reference" && source.value in schema) {
			return schema[source.value].value
		} else {
			throw new Error("Invalid dereference morphism")
		}
	} else if (morphism.type === "initial") {
		throw new Error("Not implemented")
	} else if (morphism.type === "terminal") {
		return Object.freeze({ type: "unit" })
	} else if (morphism.type === "composition") {
		const [a, b] = morphism.morphisms
		return apply(schema, apply(schema, source, a), b)
	} else if (morphism.type === "projection") {
		if (source.type === "product" && morphism.index in source.components) {
			const { value } = source.components[morphism.index]
			return value
		} else {
			throw new Error("Invalid projection morphism")
		}
	} else if (morphism.type === "injection") {
		const { options, index } = morphism
		if (index in options && typeEqual(source, options[index].value)) {
			return Object.freeze({ type: "coproduct", options })
		} else {
			throw new Error("Invalid injection morphism")
		}
	} else if (morphism.type === "tuple") {
		return Object.freeze({
			type: "product",
			components: Object.freeze(
				Array.from(applyComponents(schema, source, morphism))
			),
		})
	} else if (morphism.type === "case") {
		return Object.freeze({
			type: "coproduct",
			options: Object.freeze(
				Array.from(applyOptions(schema, source, morphism))
			),
		})
	} else {
		signalInvalidType(morphism)
	}
}

function* applyComponents(
	schema: APG.Schema,
	source: APG.Type,
	{ keys: keys, morphisms }: APG.Tuple
): Generator<APG.Component, void, undefined> {
	for (const [key, morphism] of zip(keys, morphisms)) {
		const value = apply(schema, source, morphism)
		yield Object.freeze({ type: "component", key, value })
	}
}

function* applyOptions(
	schema: APG.Schema,
	source: APG.Type,
	{ keys: keys, morphisms }: APG.Case
): Generator<APG.Option, void, undefined> {
	for (const [key, morphism] of zip(keys, morphisms)) {
		const value = apply(schema, source, morphism)
		yield Object.freeze({ type: "option", key, value })
	}
}

export function validateMorphism(
	morphism: APG.Morphism,
	source: APG.Type,
	target: APG.Type,
	schema: APG.Schema
): boolean {
	if (morphism.type === "constant") {
		return validateValue(morphism.value, target)
	} else if (morphism.type === "dereference") {
		return (
			source.type === "reference" &&
			source.value in schema &&
			typeEqual(schema[source.value].value, target)
		)
	} else if (morphism.type === "identity") {
		return typeEqual(source, target)
	} else if (morphism.type === "initial") {
		return false // TODO
	} else if (morphism.type === "terminal") {
		return target.type === "unit"
	} else if (morphism.type === "composition") {
		const type = morphism.morphisms.reduce(
			(type: APG.Type | null, morphism) =>
				type === null ? null : apply(schema, type, morphism),
			source
		)
		return type !== null && typeEqual(type, target)
	} else if (morphism.type === "projection") {
		if (source.type !== "product") {
			return false
		} else if (morphism.index >= source.components.length) {
			return false
		}
		const { value } = source.components[morphism.index]
		return typeEqual(value, target)
	} else if (morphism.type === "injection") {
		if (target.type !== "coproduct") {
			return false
		} else if (morphism.index >= target.options.length) {
			return false
		}
		const { value } = target.options[morphism.index]
		return typeEqual(source, value)
	} else if (morphism.type === "tuple") {
		if (target.type !== "product") {
			return false
		}

		const { morphisms, keys: componentKeys } = morphism
		const { components } = target

		if (
			morphisms.length !== components.length ||
			componentKeys.length !== components.length
		) {
			return false
		}

		for (const [k, m, c] of zip(componentKeys, morphisms, components)) {
			if (k === c.key && validateMorphism(m, source, c.value, schema)) {
				continue
			} else {
				return false
			}
		}

		return true
	} else if (morphism.type === "case") {
		if (source.type !== "coproduct") {
			return false
		}

		const { morphisms, keys: optionKeys } = morphism
		const { options } = source

		if (
			morphisms.length !== options.length ||
			optionKeys.length !== options.length
		) {
			return false
		}

		for (const [k, m, o] of zip(optionKeys, morphisms, options)) {
			if (k === o.key && validateMorphism(m, o.value, target, schema)) {
				continue
			} else {
				return false
			}
		}
		return true
	} else {
		signalInvalidType(morphism)
	}
}
