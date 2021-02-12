import * as Mapping from "./mapping.js"
import * as Schema from "../schema/schema.js"
import * as Instance from "../instance/instance.js"

import {
	zip,
	signalInvalidType,
	getKeys,
	forEntries,
	mapKeys,
} from "../utils.js"

import { validateExpressions } from "./apply.js"

export function validateMapping(
	M: Mapping.Mapping,
	S: Schema.Schema,
	T: Schema.Schema
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
	M: Mapping.Mapping,
	S: Schema.Schema,
	T: Schema.Schema,
	type: Schema.Type
): Schema.Type {
	if (type.kind === "reference") {
		const { source } = M[type.value]
		const value = T[source]
		if (value === undefined) {
			throw new Error("Invalid reference index")
		} else {
			return value
		}
	} else if (type.kind === "uri") {
		return type
	} else if (type.kind === "literal") {
		return type
	} else if (type.kind === "product") {
		return Schema.product(
			mapKeys(type.components, (value) => fold(M, S, T, value))
		)
	} else if (type.kind === "coproduct") {
		return Schema.coproduct(
			mapKeys(type.options, (value) => fold(M, S, T, value))
		)
	} else {
		signalInvalidType(type)
	}
}

export const mapExpressions = (
	expressions: readonly Mapping.Expression[],
	value: Instance.Value,
	instance: Instance.Instance,
	schema: Schema.Schema
) =>
	expressions.reduce(
		(value: Instance.Value, expression: Mapping.Expression) =>
			map(expression, value, instance, schema),
		value
	)

export function map(
	expression: Mapping.Expression,
	value: Instance.Value,
	instance: Instance.Instance,
	schema: Schema.Schema
): Instance.Value {
	if (expression.kind === "identifier") {
		return Instance.uri(expression.value)
	} else if (expression.kind === "constant") {
		return Instance.literal(expression.value, Instance.uri(expression.datatype))
	} else if (expression.kind === "dereference") {
		if (value.kind === "reference") {
			const { key } = expression
			if (key in instance && value.index in instance[key]) {
				return instance[key][value.index]
			} else {
				throw new Error("Invalid pointer dereference")
			}
		} else {
			throw new Error("Invalid pointer dereference")
		}
	} else if (expression.kind === "projection") {
		if (value.kind === "product") {
			return value.get(expression.key)
		} else {
			throw new Error("Invalid projection")
		}
	} else if (expression.kind === "match") {
		if (value.kind === "coproduct") {
			if (value.key in expression.cases) {
				const c = expression.cases[value.key]
				return mapExpressions(c, value.value, instance, schema)
			} else {
				throw new Error("Invalid case analysis")
			}
		} else {
			throw new Error("Invalid match morphism")
		}
	} else if (expression.kind === "tuple") {
		const keys = getKeys(expression.slots)
		return Instance.product(
			keys,
			keys.map((key) =>
				mapExpressions(expression.slots[key], value, instance, schema)
			)
		)
	} else if (expression.kind === "injection") {
		return Instance.coproduct(
			Object.freeze([expression.key]),
			expression.key,
			value
		)
	} else {
		signalInvalidType(expression)
	}
}

export function delta(
	M: Mapping.Mapping,
	S: Schema.Schema,
	T: Schema.Schema,
	TI: Instance.Instance
): Instance.Instance {
	const SI: Instance.Instance = mapKeys(S, () => [])

	const indices = mapKeys(S, () => new Map<Instance.Value, number>())

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

const placeholder = Instance.uri("")

type State = {
	M: Mapping.Mapping
	S: Schema.Schema
	T: Schema.Schema
	SI: Instance.Instance
	TI: Instance.Instance
	indices: Readonly<{ [key: string]: Map<Instance.Value, number> }>
}

function pullback(
	state: State,
	type: Schema.Type, // in source
	value: Instance.Value // of image
): Instance.Value {
	if (Schema.isReference(type)) {
		// Here we actually know that value is an instance of M1[type.value]
		// So now what?
		// First we check to see if the value is in the index cache.
		// (We're ultimately going to return a Pointer for sure)
		const index = state.indices[type.value].get(value)
		if (index !== undefined) {
			return Instance.reference(index)
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
			return Instance.reference(index)
		}
	} else if (Schema.isUri(type)) {
		if (value.kind !== "uri") {
			throw new Error("Invalid image value: expected iri")
		} else {
			return value
		}
	} else if (Schema.isLiteral(type)) {
		if (value.kind !== "literal") {
			throw new Error("Invalid image value: expected literal")
		} else {
			return value
		}
	} else if (Schema.isProduct(type)) {
		if (value.kind !== "product") {
			throw new Error("Invalid image value: expected record")
		} else {
			return Instance.product(
				value.components,
				pullbackComponents(state, type, value)
			)
		}
	} else if (Schema.isCoproduct(type)) {
		if (value.kind !== "coproduct") {
			throw new Error("Invalid image value: expected variant")
		} else if (value.key in type.options) {
			return Instance.coproduct(
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
	type: Schema.Product,
	value: Instance.Product
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
