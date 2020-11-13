import { v4 as uuid } from "uuid"

import zip from "ziterable"

import APG from "./apg.js"

export function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error("Invalid type")
}

export function* forType(
	type: APG.Type,
	stack?: APG.Type[]
): Generator<[APG.Type, APG.Type[]], void, undefined> {
	if (stack === undefined) {
		stack = []
	} else if (stack.includes(type)) {
		throw new Error("Recursive type")
	}

	yield [type, stack]
	if (type.type === "product") {
		stack.push(type)
		for (const { value } of type.components) {
			yield* forType(value, stack)
		}
		stack.pop()
	} else if (type.type === "coproduct") {
		stack.push(type)
		for (const { value } of type.options) {
			yield* forType(value, stack)
		}
		stack.pop()
	}
}

export function* forValue(
	value: APG.Value
): Generator<[APG.Value], void, undefined> {
	yield [value]
	if (value.termType === "Record") {
		for (const leaf of value) {
			yield* forValue(leaf)
		}
	} else if (value.termType === "Variant") {
		yield* forValue(value.value)
	}
}

export function equal(a: APG.Type, b: APG.Type) {
	if (a === b) {
		return true
	} else if (a.type !== b.type) {
		return false
	} else if (a.type === "reference" && b.type === "reference") {
		return a.value === b.value
	} else if (a.type === "unit" && b.type === "unit") {
		return true
	} else if (a.type === "iri" && b.type === "iri") {
		return true
	} else if (a.type === "literal" && b.type === "literal") {
		return a.datatype === b.datatype
	} else if (a.type === "product" && b.type === "product") {
		if (a.components.length !== b.components.length) {
			return false
		}
		for (const [A, B] of zip(a.components, b.components)) {
			if (A.key !== B.key) {
				return false
			} else if (equal(A.value, B.value)) {
				continue
			} else {
				return false
			}
		}
		return true
	} else if (a.type === "coproduct" && b.type === "coproduct") {
		if (a.options.length !== b.options.length) {
			return false
		}
		for (const [A, B] of zip(a.options, b.options)) {
			if (A.key !== B.key) {
				return false
			} else if (equal(A.value, B.value)) {
				continue
			} else {
				return false
			}
		}
		return true
	} else {
		return false
	}
}

export const rootId = uuid()

let id = 0
export function getId() {
	return `${rootId}-${id++}`
}
