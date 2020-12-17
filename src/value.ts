import zip from "ziterable"
import APG from "./apg.js"
import { getKeys, signalInvalidType } from "./utils.js"

export function validateValue(type: APG.Type, value: APG.Value): boolean {
	if (type.type === "reference") {
		return value.termType === "Pointer"
	} else if (type.type === "uri") {
		return value.termType === "NamedNode"
	} else if (type.type === "literal") {
		return (
			value.termType === "Literal" && value.datatype.value === type.datatype
		)
	} else if (type.type === "product") {
		if (value.termType === "Record") {
			const keys = getKeys(type.components)
			if (keys.length !== value.length) {
				return false
			}
			for (const [k1, k2, v] of zip(keys, value.components, value)) {
				if (k1 !== k2) {
					return false
				} else if (validateValue(type.components[k1], v)) {
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
		if (value.termType === "Variant" && value.key in type.options) {
			return validateValue(type.options[value.key], value.value)
		} else {
			return false
		}
	} else {
		signalInvalidType(type)
	}
}

export function* forValue(
	value: APG.Value,
	stack: APG.Value[] = []
): Generator<[APG.Value, APG.Value[]], void, undefined> {
	if (stack.includes(value)) {
		throw new Error("Recursive type")
	}

	yield [value, stack]
	if (value.termType === "Record") {
		stack.push(value)
		for (const leaf of value) {
			yield* forValue(leaf, stack)
		}
		stack.pop()
	} else if (value.termType === "Variant") {
		stack.push(value)
		yield* forValue(value.value, stack)
		stack.pop()
	}
}
