import * as N3 from "n3.ts"
import zip from "ziterable"

import APG from "./apg.js"
import { validateMorphism } from "./morphism.js"
import { getType, getValues } from "./path.js"
import { rootId, getId, signalInvalidType } from "./utils.js"

export type Mapping = Readonly<[APG.Path[], APG.Morphism[]]>

export function validateMapping(
	[m1, m2]: Mapping,
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
	mapping: Mapping,
	source: APG.Schema,
	target: APG.Schema,
	instance: APG.Instance
): APG.Instance {
	const [m1, m2] = mapping
	const result: APG.Instance = m1.map(() => [])
	const indices = m1.map(() => new Map<APG.Value, number>())
	for (const [{ value: type }, path, morphism, i] of zip(source, m1, m2)) {
		for (const value of getValues(instance, path)) {
			if (indices[i].has(value)) {
				continue
			} else {
				const image = map(morphism, value, instance)
				const index = result[i].push(placeholder) - 1
				indices[i].set(image, index)
				result[i][index] = pullback(
					m1,
					type,
					source,
					target,
					image,
					result,
					indices
				)
			}
		}
	}

	for (const values of result) {
		Object.freeze(values)
	}

	Object.freeze(result)

	return result
}

const placeholder = new N3.NamedNode(rootId)

function pullback(
	m1: APG.Path[],
	// sourceType: APG.Type,
	sourceType: APG.Type, // imageType
	source: APG.Schema,
	target: APG.Schema,
	image: APG.Value, // neither
	instance: APG.Instance,
	indices: Map<APG.Value, number>[]
): APG.Value {
	console.log("pulling it back", sourceType, image)
	// if (sourceType.type === "reference") {
	// } else if (sourceType.type === "unit") {
	// } else if (sourceType.type === "iri") {
	// } else if (sourceType.type === "literal") {
	// } else if (sourceType.type === "product") {
	// } else if (sourceType.type === "coproduct") {
	// } else {
	// 	signalInvalidType(sourceType)
	// }

	if (sourceType.type === "reference") {
		// if (image.termType === "Pointer") {
		// 	return image
		// } else {
		// 	throw new Error("Invalid image value: expected pointer")
		// }

		// image is actually an instance of targetType - *not* a Pointer
		const t2 = getType(target, m1[sourceType.value])
		console.log("I PROMISE YOU that", image, "is an instance of", t2)
		const index = indices[sourceType.value].get(image)
		if (index === undefined) {
			const index = instance[sourceType.value].push(placeholder) - 1
			indices[sourceType.value].set(image, index)
			instance[sourceType.value][index] = pullback(
				m1,
				// t2,
				source[sourceType.value].value,
				source,
				target,
				image,
				instance,
				indices
			)
			return new APG.Pointer(index, sourceType.value)
		} else {
			return new APG.Pointer(index, sourceType.value)
		}
	} else if (sourceType.type === "unit") {
		if (image.termType !== "BlankNode") {
			throw new Error("Invalid image value: expected blank node")
		} else {
			return image
		}
	} else if (sourceType.type === "iri") {
		if (image.termType !== "NamedNode") {
			throw new Error("Invalid image value: expected iri")
		} else {
			return image
		}
	} else if (sourceType.type === "literal") {
		if (image.termType !== "Literal") {
			throw new Error("Invalid image value: expected literal")
		} else {
			return image
		}
	} else if (sourceType.type === "product") {
		if (image.termType !== "Record") {
			console.log(sourceType, image)
			throw new Error("Invalid image value: expected record")
		} else {
			return new APG.Record(
				image.node,
				image.componentKeys,
				image.map((field, i) => {
					const { value } = sourceType.components[i]
					return pullback(m1, value, source, target, field, instance, indices)
				})
			)
		}
	} else if (sourceType.type === "coproduct") {
		if (image.termType !== "Variant") {
			throw new Error("Invalid image value: expected variant")
		} else {
			const { value } = sourceType.options[image.index]
			return new APG.Variant(
				image.node,
				image.optionKeys,
				image.index,
				pullback(m1, value, source, target, image.value, instance, indices)
			)
		}
	} else {
		signalInvalidType(sourceType)
	}
}
