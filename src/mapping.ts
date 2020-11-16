import * as N3 from "n3.ts"
import zip from "ziterable"

import APG from "./apg.js"
import { validateMorphism } from "./morphism.js"
import { getType, getValues } from "./path.js"
import { rootId, getId, signalInvalidType } from "./utils.js"

export function validateMapping(
	[m1, m2]: APG.Mapping,
	source: APG.Schema,
	target: APG.Schema
): boolean {
	for (const [{ value }, path, morphism] of zip(source, m1, m2)) {
		const type = getType(target, path)
		if (validateMorphism(morphism, type, fold(m1, value, target), target)) {
			continue
		} else {
			return false
		}
	}

	return true
}

export function fold(
	m1: APG.Path[],
	type: APG.Type,
	target: APG.Schema
): APG.Type {
	if (type.type === "reference") {
		const value = getType(target, m1[type.value])
		if (value === undefined) {
			throw new Error("Invalid reference index")
		} else {
			return value
		}
	} else if (type.type === "unit") {
		return type
	} else if (type.type === "iri") {
		return type
	} else if (type.type === "literal") {
		return type
	} else if (type.type === "product") {
		const components: APG.Component[] = []
		for (const { key, value } of type.components) {
			components.push(
				Object.freeze({
					type: "component",
					key,
					value: fold(m1, value, target),
				})
			)
		}
		Object.freeze(components)
		return Object.freeze({ type: "product", components })
	} else if (type.type === "coproduct") {
		const options: APG.Option[] = []
		for (const { key, value } of type.options) {
			options.push(
				Object.freeze({ type: "option", key, value: fold(m1, value, target) })
			)
		}
		Object.freeze(options)
		return Object.freeze({ type: "coproduct", options })
	} else {
		signalInvalidType(type)
	}
}

export function map(
	morphism: APG.Morphism,
	value: APG.Value,
	instance: APG.Instance
): APG.Value {
	if (morphism.type === "identity") {
		return value
	} else if (morphism.type === "initial") {
		throw new Error("Invalid initial morphism")
	} else if (morphism.type === "terminal") {
		if (value.termType === "BlankNode") {
			return value
		} else {
			throw new Error("Invalid terminal morphism")
		}
	} else if (morphism.type === "dereference") {
		if (value.termType === "Pointer") {
			return instance[value.label][value.index]
		} else {
			throw new Error("Invalid pointer dereference")
		}
	} else if (morphism.type === "constant") {
		return morphism.value
	} else if (morphism.type === "composition") {
		const [f, g] = morphism.morphisms
		return map(g, map(f, value, instance), instance)
	} else if (morphism.type === "projection") {
		if (
			value.termType === "Record" &&
			value.componentKeys[morphism.index] ===
				morphism.componentKeys[morphism.index]
		) {
			return value[morphism.index]
		} else {
			console.error(value, morphism)
			throw new Error("Invalid projection")
		}
	} else if (morphism.type === "case") {
		if (
			value.termType === "Variant" &&
			value.optionKeys[value.index] === morphism.optionKeys[value.index]
		) {
			return map(morphism.morphisms[value.index], value.value, instance)
		} else {
			throw new Error("Invalid case analysis")
		}
	} else if (morphism.type === "tuple") {
		return new APG.Record(
			new N3.BlankNode(getId()),
			morphism.componentKeys,
			morphism.morphisms.map((morphism) => map(morphism, value, instance))
		)
	} else if (morphism.type === "injection") {
		return new APG.Variant(
			new N3.BlankNode(getId()),
			morphism.optionKeys,
			morphism.index,
			value
		)
	} else {
		signalInvalidType(morphism)
	}
}

export function delta(
	M: APG.Mapping,
	S: APG.Schema,
	T: APG.Schema,
	TI: APG.Instance
): APG.Instance {
	const [M1, M2] = M
	const SI: APG.Instance = M1.map(() => [])
	const indices = M1.map(() => new Map<APG.Value, number>())
	for (const [{ value: type }, path, morphism, i] of zip(S, M1, M2)) {
		for (const value of getValues(TI, path)) {
			if (indices[i].has(value)) {
				continue
			} else {
				const imageValue = map(morphism, value, TI)
				const index = SI[i].push(placeholder) - 1
				indices[i].set(value, index)
				SI[i][index] = pullback(M, S, T, SI, TI, indices, type, imageValue)
			}
		}
	}

	for (const values of SI) {
		Object.freeze(values)
	}

	Object.freeze(SI)

	return SI
}

const placeholder = new N3.NamedNode(rootId)

function pullback(
	M: APG.Mapping,
	S: APG.Schema,
	T: APG.Schema,
	SI: APG.Instance,
	TI: APG.Instance,
	indices: Map<APG.Value, number>[],
	type: APG.Type, // in source
	value: APG.Value // of image
): APG.Value {
	const [{}, M2] = M
	if (type.type === "reference") {
		// Here we actually know that value is an instance of M1[type.value]
		// So now what?
		// First we check to see if the value is in the index cache.
		// (We're ultimately going to return a Pointer for sure)
		const index = indices[type.value].get(value)
		if (index !== undefined) {
			return new APG.Pointer(index, type.value)
		} else {
			// Otherwise, we map value along the morphism M2[type.value].
			// This gives us a value that is an instance of the image of the referenced type
			// - ie an instance of fold(M1, S[type.value].value, T)
			const t = S[type.value].value
			const v = map(M2[type.value], value, TI)
			const index = SI[type.value].push(placeholder) - 1
			indices[type.value].set(value, index)
			const p = pullback(M, S, T, SI, TI, indices, t, v)
			SI[type.value][index] = p
			return new APG.Pointer(index, type.value)
		}
	} else if (type.type === "unit") {
		if (value.termType !== "BlankNode") {
			throw new Error("Invalid image value: expected blank node")
		} else {
			return value
		}
	} else if (type.type === "iri") {
		if (value.termType !== "NamedNode") {
			throw new Error("Invalid image value: expected iri")
		} else {
			return value
		}
	} else if (type.type === "literal") {
		if (value.termType !== "Literal") {
			throw new Error("Invalid image value: expected literal")
		} else {
			return value
		}
	} else if (type.type === "product") {
		if (value.termType !== "Record") {
			throw new Error("Invalid image value: expected record")
		} else {
			return new APG.Record(
				value.node,
				value.componentKeys,
				pullbackComponents(M, S, T, SI, TI, indices, type, value)
			)
		}
	} else if (type.type === "coproduct") {
		if (value.termType !== "Variant") {
			throw new Error("Invalid image value: expected variant")
		} else {
			const { value: t } = type.options[value.index]
			return new APG.Variant(
				value.node,
				value.optionKeys,
				value.index,
				pullback(M, S, T, SI, TI, indices, t, value.value)
			)
		}
	} else {
		signalInvalidType(type)
	}
}

function* pullbackComponents(
	M: APG.Mapping,
	S: APG.Schema,
	T: APG.Schema,
	SI: APG.Instance,
	TI: APG.Instance,
	indices: Map<APG.Value, number>[],
	type: APG.Product,
	value: APG.Record
) {
	for (const [t, field] of zip(type.components, value)) {
		yield pullback(M, S, T, SI, TI, indices, t.value, field)
	}
}
