import * as Schema from "../schema/schema.js"
import * as Instance from "./instance.js"
import { forEntries, getKeys, zip } from "../utils.js"
import { isTypeEqual } from "../schema/utils.js"

export function validateInstance<S extends { [key in string]: Schema.Type }>(
	schema: Schema.Schema<S>,
	instance: Instance.Instance<S>
) {
	const iter = zip(forEntries(schema), forEntries(instance))
	for (const [[k1, type], [k2, values]] of iter) {
		if (k1 !== k2) {
			return false
		}
		for (const value of values) {
			if (validateValue(type, value)) {
				continue
			} else {
				return false
			}
		}
	}
	return true
}

export function validateValue<
	T extends Schema.Type,
	V extends Instance.Value<T>
>(type: T, value: V): boolean {
	if (Schema.isReference(type)) {
		return Instance.isReference(value) && type.value === value.type.value
	} else if (Schema.isUri(type)) {
		return Instance.isUri(value)
	} else if (Schema.isLiteral(type)) {
		return Instance.isLiteral(value) && type.datatype === value.type.datatype
	} else if (Schema.isProduct(type)) {
		if (Instance.isProduct(value)) {
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
	} else if (Schema.isCoproduct(type)) {
		if (Instance.isCoproduct(value) && value.option in type.options) {
			return validateValue(type.options[value.option], value.value)
		} else {
			return false
		}
	} else {
		console.error(type)
		throw new Error("Unexpected type")
	}
}

export function* forValue(
	value: Instance.Value,
	stack: Instance.Value[] = []
): Generator<[Instance.Value, Instance.Value[]], void, undefined> {
	if (stack.includes(value)) {
		throw new Error("Recursive type")
	}

	yield [value, stack]
	if (Instance.isProduct(value)) {
		stack.push(value)
		for (const leaf of value) {
			yield* forValue(leaf, stack)
		}
		stack.pop()
	} else if (Instance.isCoproduct(value)) {
		stack.push(value)
		yield* forValue(value.value, stack)
		stack.pop()
	}
}
