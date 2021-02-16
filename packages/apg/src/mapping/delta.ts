import * as Mapping from "./mapping.js"
import * as Schema from "../schema/schema.js"
import * as Instance from "../instance/instance.js"

import { signalInvalidType, getKeys, mapKeys } from "../utils.js"
import { mapExpressions } from "./map.js"

export function delta(
	M: Mapping.Mapping,
	S: Schema.Schema,
	T: Schema.Schema,
	TI: Instance.Instance
): Instance.Instance {
	const SI: Instance.Instance = mapKeys(S, () => [])

	const indices = mapKeys(S, () => new Map<Instance.Value, number>())

	for (const key of getKeys(S)) {
		if (!(key in M) || !(key in indices)) {
			throw new Error("Invalid mapping")
		}

		const { source, value: expressions } = M[key]
		if (!(source in TI)) {
			throw new Error("Invalid instance")
		}

		for (const value of TI[source]) {
			if (indices[key].has(value)) {
				continue
			} else {
				const [imageType, imageValue] = mapExpressions(
					{ S: T, SI: TI },
					expressions,
					T[source],
					value
				)
				const i = SI[key].push(placeholder) - 1
				indices[key].set(value, i)
				SI[key][i] = pullback(
					{ M, S, T, SI, TI, indices },
					S[key],
					imageType,
					imageValue
				)
			}
		}
	}

	for (const key of getKeys(S)) {
		Object.freeze(SI[key])
	}

	Object.freeze(SI)

	return SI
}

const placeholder = new Instance.Product([])

type State = {
	M: Mapping.Mapping
	S: Schema.Schema
	T: Schema.Schema
	SI: Instance.Instance
	TI: Instance.Instance
	indices: Readonly<Record<string, Map<Instance.Value, number>>>
}

// pullback basically just rewrites the values to be instances of
// the actual source types instead of the mapped result types, which
// might only be *assignable* to the source types.
// However if the source type is a reference, then we have to do a
// little magic to locate the corresponding pointer value in state.indices
function pullback(
	state: State,
	sourceType: Schema.Type,
	imageType: Schema.Type,
	imageValue: Instance.Value
): Instance.Value {
	if (Schema.isReference(sourceType)) {
		// Here we actually know that value is an instance of M1[sourceType.value]
		// So now what?
		// First we check to see if the value is in the index cache.
		// (We're ultimately going to return a Instance.Reference for sure)
		const index = state.indices[sourceType.value].get(imageValue)
		if (index !== undefined) {
			return Instance.reference(sourceType, index)
		} else {
			// Otherwise, we map value along the morphism M2[sourceType.value].
			// This gives us a value that is an instance of the image of the referenced type
			// - ie an instance of fold(M1, T, S[sourceType.value])
			const t = state.S[sourceType.value] // t is basically a "dereferenced source type"
			const { value: expressions } = state.M[sourceType.value] // m is the map that will give us an instance of t
			// resultType and resultValue are the "dereferenced image type & value"
			const [resultType, resultValue] = mapExpressions(
				{ S: state.T, SI: state.TI },
				expressions,
				imageType,
				imageValue
			)
			// here resultType should be equal to fold(M1, T, S[sourceType.value])
			const index = state.SI[sourceType.value].push(placeholder) - 1
			state.indices[sourceType.value].set(imageValue, index)
			const p = pullback(state, t, resultType, resultValue)
			state.SI[sourceType.value][index] = p
			return Instance.reference(sourceType, index)
		}
	} else if (Schema.isUri(sourceType)) {
		if (imageType.kind !== "uri" || imageValue.kind !== "uri") {
			throw new Error("Invalid image value: expected iri")
		} else {
			return imageValue
		}
	} else if (Schema.isLiteral(sourceType)) {
		if (imageType.kind !== "literal" || imageValue.kind !== "literal") {
			throw new Error("Invalid image value: expected literal")
		} else {
			return imageValue
		}
	} else if (Schema.isProduct(sourceType)) {
		if (imageType.kind !== "product" || imageValue.kind !== "product") {
			throw new Error("Invalid image value: expected record")
		} else {
			return new Instance.Product(
				pullbackComponents(state, sourceType, imageType, imageValue)
			)
		}
	} else if (Schema.isCoproduct(sourceType)) {
		if (imageType.kind !== "coproduct" || imageValue.kind !== "coproduct") {
			throw new Error("Invalid image value: expected variant")
		} else {
			const key = imageValue.key(imageType)
			return Instance.coproduct(
				sourceType,
				key,
				pullback(
					state,
					sourceType.options[key],
					imageType.options[key],
					imageValue.value
				)
			)
		}
	} else {
		signalInvalidType(sourceType)
	}
}

function* pullbackComponents(
	state: State,
	sourceType: Schema.Product,
	imageType: Schema.Product,
	imageValue: Instance.Product
): Generator<Instance.Value, void, undefined> {
	for (const key of getKeys(sourceType.components)) {
		if (key in imageType.components) {
			yield pullback(
				state,
				sourceType.components[key],
				imageType.components[key],
				imageValue.get(imageType, key)
			)
		} else {
			throw new Error(`Invalid image value: missing component ${key}`)
		}
	}
}
