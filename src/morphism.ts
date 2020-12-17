import zip from "ziterable"
import APG from "./apg.js"

import { isTypeAssignable, unify } from "./type.js"
import { forEntries, getKeys, mapKeys, signalInvalidType } from "./utils.js"

export const applyExpressions = (
	S: APG.Schema,
	expressions: readonly APG.Expression[],
	source: APG.Type
) =>
	expressions.reduce(
		(type: APG.Type, expression: APG.Expression) => apply(S, expression, type),
		source
	)

export function apply(
	S: APG.Schema,
	expression: APG.Expression,
	source: APG.Type
): APG.Type {
	if (expression.type === "identity") {
		return source
	} else if (expression.type === "identifier") {
		return APG.uri()
	} else if (expression.type === "constant") {
		return APG.literal(expression.datatype)
	} else if (expression.type === "dereference") {
		if (
			source.type === "reference" &&
			source.value in S &&
			source.value === expression.key
		) {
			return S[source.value]
		} else {
			throw new Error("Invalid dereference morphism")
		}
	} else if (expression.type === "projection") {
		if (source.type === "product" && expression.key in source.components) {
			return source.components[expression.key]
		} else {
			throw new Error("Invalid projection morphism")
		}
	} else if (expression.type === "injection") {
		const { key, value } = expression
		return APG.coproduct({
			[key]: value.reduce(
				(type, expression) => apply(S, expression, type),
				source
			),
		})
	} else if (expression.type === "tuple") {
		return APG.product(
			mapKeys(expression.slots, (value) => applyExpressions(S, value, source))
		)
	} else if (expression.type === "match") {
		if (source.type === "coproduct") {
			const cases = Array.from(applyCases(S, source, expression))
			if (cases.length === 0) {
				throw new Error("Empty case analysis")
			} else {
				return cases.reduce(unify)
			}
		} else {
			throw new Error("Invalid match morphism")
		}
	} else {
		signalInvalidType(expression)
	}
}

function* applyCases(
	S: APG.Schema,
	source: APG.Coproduct,
	{ cases }: APG.Match
): Generator<APG.Type, void, undefined> {
	for (const key of getKeys(source.options)) {
		if (key in cases) {
			yield applyExpressions(S, cases[key], source.options[key])
		} else {
			throw new Error("Invalid case analysis")
		}
	}
}

export function validateExpressions(
	S: APG.Schema,
	expressions: readonly APG.Expression[],
	source: APG.Type,
	target: APG.Type
): boolean {
	let type: APG.Type
	try {
		type = applyExpressions(S, expressions, source)
	} catch (e) {
		return false
	}

	return isTypeAssignable(type, target)
}
