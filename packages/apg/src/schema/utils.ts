import * as Schema from "./schema.js"

import { getKeys, zip } from "../utils.js"

function* forType(
	type: Schema.Type,
	key: string,
	path: string[]
): Generator<[Schema.Type, string, string[]], void, undefined> {
	yield [type, key, path]
	if (type.kind === "product") {
		for (const component of getKeys(type.components)) {
			path.push(component)
			yield* forType(type.components[component], key, path)
			path.pop()
		}
	} else if (type.kind === "coproduct") {
		for (const option of getKeys(type.options)) {
			path.push(option)
			yield* forType(type.options[option], key, path)
			path.pop()
		}
	}
}

export function* forTypes(
	schema: Schema.Schema
): Generator<[Schema.Type, string, string[]], void, undefined> {
	for (const key of getKeys(schema)) {
		yield* forType(schema[key], key, [])
	}
}

export function isTypeEqual(a: Schema.Type, b: Schema.Type) {
	if (a === b) {
		return true
	} else if (a.kind !== b.kind) {
		return false
	} else if (a.kind === "reference" && b.kind === "reference") {
		return a.key === b.key
	} else if (a.kind === "uri" && b.kind === "uri") {
		return true
	} else if (a.kind === "literal" && b.kind === "literal") {
		return a.datatype === b.datatype
	} else if (a.kind === "product" && b.kind === "product") {
		const A = getKeys(a.components)
		const B = getKeys(b.components)
		if (A.length !== B.length) {
			return false
		}
		for (const [keyA, keyB] of zip(A, B)) {
			if (keyA !== keyB) {
				return false
			} else if (isTypeEqual(a.components[keyA], b.components[keyB])) {
				continue
			} else {
				return false
			}
		}
		return true
	} else if (a.kind === "coproduct" && b.kind === "coproduct") {
		const A = getKeys(a.options)
		const B = getKeys(b.options)
		if (A.length !== B.length) {
			return false
		}
		for (const [keyA, keyB] of zip(A, B)) {
			if (keyA !== keyB) {
				return false
			} else if (isTypeEqual(a.options[keyA], b.options[keyB])) {
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

export function isTypeAssignable(a: Schema.Type, b: Schema.Type): boolean {
	if (a === b) {
		return true
	} else if (a.kind !== b.kind) {
		return false
	} else if (a.kind === "reference" && b.kind === "reference") {
		return a.key === b.key
	} else if (a.kind === "uri" && b.kind === "uri") {
		return true
	} else if (a.kind === "literal" && b.kind === "literal") {
		return a.datatype === b.datatype
	} else if (a.kind === "product" && b.kind === "product") {
		for (const key of getKeys(b.components)) {
			if (
				key in a.components &&
				isTypeAssignable(a.components[key], b.components[key])
			) {
				continue
			} else {
				return false
			}
		}
		return true
	} else if (a.kind === "coproduct" && b.kind === "coproduct") {
		for (const key of getKeys(a.options)) {
			if (
				key in b.options &&
				isTypeAssignable(a.options[key], b.options[key])
			) {
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

export function unify(a: Schema.Type, b: Schema.Type): Schema.Type {
	if (a === b) {
		return b
	} else if (a.kind === "reference" && b.kind === "reference") {
		if (a.key === b.key) {
			return b
		}
	} else if (a.kind === "uri" && b.kind === "uri") {
		return b
	} else if (a.kind === "literal" && b.kind === "literal") {
		if (a.datatype === b.datatype) {
			return b
		}
	} else if (a.kind === "product" && b.kind === "product") {
		return Schema.product(Object.fromEntries(unifyComponents(a, b)))
	}
	if (a.kind === "coproduct" && b.kind === "coproduct") {
		return Schema.coproduct(Object.fromEntries(unifyOptions(a, b)))
	} else {
		throw new Error("Cannot unify unequal types")
	}
}

function* unifyComponents(
	a: Schema.Product,
	b: Schema.Product
): Generator<[string, Schema.Type], void, undefined> {
	const A = getKeys(a.components)
	const B = getKeys(b.components)
	if (A.length !== B.length) {
		throw new Error("Cannot unify unequal products")
	}

	for (const [keyA, keyB] of zip(A, B)) {
		if (keyA !== keyB) {
			throw new Error("Cannot unify unequal types")
		} else {
			yield [keyA, unify(a.components[keyA], b.components[keyB])]
		}
	}
}

function* unifyOptions(
	a: Schema.Coproduct,
	b: Schema.Coproduct
): Generator<[string, Schema.Type], void, undefined> {
	const keys = Array.from(
		new Set([...getKeys(a.options), ...getKeys(b.options)])
	).sort()
	for (const key of keys) {
		const A = a.options[key]
		const B = b.options[key]
		if (A !== undefined && B === undefined) {
			yield [key, A]
		} else if (A === undefined && B !== undefined) {
			yield [key, B]
		} else if (A !== undefined && B !== undefined) {
			yield [key, unify(A, B)]
		} else {
			throw new Error("Error unifying options")
		}
	}
}
