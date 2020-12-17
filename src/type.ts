import zip from "ziterable"
import APG from "./apg.js"
import { getKeys } from "./utils.js"

export function* forType(
	type: APG.Type,
	stack: APG.Type[] = []
): Generator<[APG.Type, APG.Type[]], void, undefined> {
	if (stack.includes(type)) {
		throw new Error("Recursive type")
	}

	yield [type, stack]
	if (type.type === "product") {
		stack.push(type)
		for (const key of getKeys(type.components)) {
			yield* forType(type.components[key], stack)
		}
		stack.pop()
	} else if (type.type === "coproduct") {
		stack.push(type)
		for (const key of getKeys(type.options)) {
			yield* forType(type.options[key], stack)
		}
		stack.pop()
	}
}

export function isTypeEqual(a: APG.Type, b: APG.Type) {
	if (a === b) {
		return true
	} else if (a.type !== b.type) {
		return false
	} else if (a.type === "reference" && b.type === "reference") {
		return a.value === b.value
	} else if (a.type === "uri" && b.type === "uri") {
		return true
	} else if (a.type === "literal" && b.type === "literal") {
		return a.datatype === b.datatype
	} else if (a.type === "product" && b.type === "product") {
		const A = getKeys(a.components)
		const B = getKeys(b.components)
		if (A.length !== B.length) {
			return false
		}
		for (const [keyA, keyB] of zip(A, B)) {
			if (keyA !== keyB) {
				return false
			} else if (isTypeEqual(a.components[keyA], a.components[keyB])) {
				continue
			} else {
				return false
			}
		}
		return true
	} else if (a.type === "coproduct" && b.type === "coproduct") {
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

export function isTypeAssignable(a: APG.Type, b: APG.Type): boolean {
	if (a === b) {
		return true
	} else if (a.type !== b.type) {
		return false
	} else if (a.type === "reference" && b.type === "reference") {
		return a.value === b.value
	} else if (a.type === "uri" && b.type === "uri") {
		return true
	} else if (a.type === "literal" && b.type === "literal") {
		return a.datatype === b.datatype
	} else if (a.type === "product" && b.type === "product") {
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
	} else if (a.type === "coproduct" && b.type === "coproduct") {
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

export function unify(a: APG.Type, b: APG.Type): APG.Type {
	if (a === b) {
		return b
	} else if (a.type === "reference" && b.type === "reference") {
		if (a.value === b.value) {
			return b
		}
	} else if (a.type === "uri" && b.type === "uri") {
		return b
	} else if (a.type === "literal" && b.type === "literal") {
		if (a.datatype === b.datatype) {
			return b
		}
	} else if (a.type === "product" && b.type === "product") {
		return APG.product(Object.fromEntries(unifyComponents(a, b)))
	}
	if (a.type === "coproduct" && b.type === "coproduct") {
		return APG.coproduct(Object.fromEntries(unifyOptions(a, b)))
	} else {
		throw new Error("Cannot unify unequal types")
	}
}

function* unifyComponents(
	a: APG.Product,
	b: APG.Product
): Generator<[string, APG.Type], void, undefined> {
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
	a: APG.Coproduct,
	b: APG.Coproduct
): Generator<[string, APG.Type], void, undefined> {
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
