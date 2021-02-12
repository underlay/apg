import { Schema, unify, isTypeAssignable } from "../schema/index.js"
import * as Mapping from "./mapping.js"
import { getKeys, mapKeys, signalInvalidType } from "../utils.js"

export const applyExpressions = (
	S: Schema.Schema,
	expressions: readonly Mapping.Expression[],
	source: Schema.Type
) =>
	expressions.reduce(
		(type: Schema.Type, expression: Mapping.Expression) =>
			apply(S, expression, type),
		source
	)

export function apply(
	S: Schema.Schema,
	expression: Mapping.Expression,
	source: Schema.Type
): Schema.Type {
	if (expression.kind === "identifier") {
		return Schema.uri()
	} else if (expression.kind === "constant") {
		return Schema.literal(expression.datatype)
	} else if (expression.kind === "dereference") {
		if (
			source.kind === "reference" &&
			source.value in S &&
			source.value === expression.key
		) {
			return S[source.value]
		} else {
			throw new Error("Invalid dereference morphism")
		}
	} else if (expression.kind === "projection") {
		if (source.kind === "product" && expression.key in source.components) {
			return source.components[expression.key]
		} else {
			throw new Error("Invalid projection morphism")
		}
	} else if (expression.kind === "injection") {
		const { key } = expression
		return Schema.coproduct({ [key]: source })
	} else if (expression.kind === "tuple") {
		return Schema.product(
			mapKeys(expression.slots, (value) => applyExpressions(S, value, source))
		)
	} else if (expression.kind === "match") {
		if (source.kind === "coproduct") {
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
	S: Schema.Schema,
	source: Schema.Coproduct,
	{ cases }: Mapping.Match
): Generator<Schema.Type, void, undefined> {
	for (const key of getKeys(source.options)) {
		if (key in cases) {
			yield applyExpressions(S, cases[key], source.options[key])
		} else {
			throw new Error("Invalid case analysis")
		}
	}
}

export function validateExpressions(
	S: Schema.Schema,
	expressions: readonly Mapping.Expression[],
	source: Schema.Type,
	target: Schema.Type
): boolean {
	let type: Schema.Type
	try {
		type = applyExpressions(S, expressions, source)
	} catch (e) {
		return false
	}

	return isTypeAssignable(type, target)
}
