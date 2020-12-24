import * as N3 from "n3.ts"
import zip from "ziterable"

import * as APG from "./apg.js"
import { validateExpressions } from "./morphism.js"

import {
	rootId,
	signalInvalidType,
	getKeys,
	forEntries,
	mapKeys,
} from "./utils.js"

export function validateMapping(
	M: APG.Mapping,
	S: APG.Schema,
	T: APG.Schema
): boolean {
	for (const [key, type] of forEntries(S)) {
		if (!(key in M)) {
			return false
		}

		const { source, value } = M[key]
		if (validateExpressions(S, value, T[source], fold(M, S, T, type))) {
			continue
		} else {
			return false
		}
	}

	return true
}

export function fold(
	M: APG.Mapping,
	S: APG.Schema,
	T: APG.Schema,
	type: APG.Type
): APG.Type {
	if (type.type === "reference") {
		const { source } = M[type.value]
		const value = T[source]
		if (value === undefined) {
			throw new Error("Invalid reference index")
		} else {
			return value
		}
	} else if (type.type === "uri") {
		return type
	} else if (type.type === "literal") {
		return type
	} else if (type.type === "product") {
		return APG.product(
			mapKeys(type.components, (value) => fold(M, S, T, value))
		)
	} else if (type.type === "coproduct") {
		return APG.coproduct(mapKeys(type.options, (value) => fold(M, S, T, value)))
	} else {
		signalInvalidType(type)
	}
}

export const mapExpressions = (
	expressions: readonly APG.Expression[],
	value: APG.Value,
	instance: APG.Instance,
	schema: APG.Schema
) =>
	expressions.reduce(
		(value: APG.Value, expression: APG.Expression) =>
			map(expression, value, instance, schema),
		value
	)

export function map(
	expression: APG.Expression,
	value: APG.Value,
	instance: APG.Instance,
	schema: APG.Schema
): APG.Value {
	if (expression.type === "identifier") {
		return new N3.NamedNode(expression.value)
	} else if (expression.type === "constant") {
		return new N3.Literal(
			expression.value,
			"",
			new N3.NamedNode(expression.datatype)
		)
	} else if (expression.type === "dereference") {
		if (value.termType === "Pointer") {
			const { key } = expression
			if (key in instance && value.index in instance[key]) {
				return instance[key][value.index]
			} else {
				throw new Error("Invalid pointer dereference")
			}
		} else {
			throw new Error("Invalid pointer dereference")
		}
	} else if (expression.type === "projection") {
		if (value.termType === "Record") {
			return value.get(expression.key)
		} else {
			throw new Error("Invalid projection")
		}
	} else if (expression.type === "match") {
		if (value.termType === "Variant") {
			if (value.key in expression.cases) {
				const c = expression.cases[value.key]
				return mapExpressions(c, value.value, instance, schema)
			} else {
				throw new Error("Invalid case analysis")
			}
		} else {
			throw new Error("Invalid match morphism")
		}
	} else if (expression.type === "tuple") {
		const keys = getKeys(expression.slots)
		return new APG.Record(
			keys,
			keys.map((key) =>
				mapExpressions(expression.slots[key], value, instance, schema)
			)
		)
	} else if (expression.type === "injection") {
		return new APG.Variant(
			Object.freeze([expression.key]),
			expression.key,
			value
		)
	} else {
		signalInvalidType(expression)
	}
}

export function delta(
	M: APG.Mapping,
	S: APG.Schema,
	T: APG.Schema,
	TI: APG.Instance
): APG.Instance {
	const SI: APG.Instance = mapKeys(S, () => [])

	const indices = mapKeys(S, () => new Map<APG.Value, number>())

	for (const [key, type] of forEntries(S)) {
		if (!(key in M) || !(key in indices)) {
			throw new Error("Invalid mapping")
		}

		const { source } = M[key]
		if (!(source in TI)) {
			throw new Error("Invalid instance")
		}

		for (const value of TI[source]) {
			if (indices[key].has(value)) {
				continue
			} else {
				const imageValue = mapExpressions(M[key].value, value, TI, T)
				const i = SI[key].push(placeholder) - 1
				indices[key].set(value, i)
				SI[key][i] = pullback({ M, S, T, SI, TI, indices }, type, imageValue)
			}
		}
	}

	for (const key of getKeys(S)) {
		Object.freeze(SI[key])
	}

	Object.freeze(SI)

	return SI
}

const placeholder = new N3.NamedNode(rootId)

type State = {
	M: APG.Mapping
	S: APG.Schema
	T: APG.Schema
	SI: APG.Instance
	TI: APG.Instance
	indices: Readonly<{ [key: string]: Map<APG.Value, number> }>
}

function pullback(
	state: State,
	type: APG.Type, // in source
	value: APG.Value // of image
): APG.Value {
	if (type.type === "reference") {
		// Here we actually know that value is an instance of M1[type.value]
		// So now what?
		// First we check to see if the value is in the index cache.
		// (We're ultimately going to return a Pointer for sure)
		const index = state.indices[type.value].get(value)
		if (index !== undefined) {
			return new APG.Pointer(index)
		} else {
			// Otherwise, we map value along the morphism M2[type.value].
			// This gives us a value that is an instance of the image of the referenced type
			// - ie an instance of fold(M1, T, S[type.value].value)
			const t = state.S[type.value]
			const m = state.M[type.value]
			const v = mapExpressions(m.value, value, state.TI, state.T)
			const index = state.SI[type.value].push(placeholder) - 1
			state.indices[type.value].set(value, index)
			const p = pullback(state, t, v)
			state.SI[type.value][index] = p
			return new APG.Pointer(index)
		}
	} else if (type.type === "uri") {
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
				value.components,
				pullbackComponents(state, type, value)
			)
		}
	} else if (type.type === "coproduct") {
		if (value.termType !== "Variant") {
			throw new Error("Invalid image value: expected variant")
		} else if (value.key in type.options) {
			return new APG.Variant(
				value.options,
				value.key,
				pullback(state, type.options[value.key], value.value)
			)
		} else {
			throw new Error("Invalid image variant")
		}
	} else {
		signalInvalidType(type)
	}
}

function* pullbackComponents(
	state: State,
	type: APG.Product,
	value: APG.Record
) {
	for (const [k1, k2, field] of zip(
		getKeys(type.components),
		value.components,
		value
	)) {
		if (k1 === k2) {
			yield pullback(state, type.components[k1], field)
		} else {
			throw new Error("Invalid image record")
		}
	}
}
