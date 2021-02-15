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
	if (expression.kind === "uri") {
		return Schema.uri()
	} else if (expression.kind === "literal") {
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
	} else if (expression.kind === "product") {
		return Schema.product(
			mapKeys(expression.components, (value) =>
				applyExpressions(S, value, source)
			)
		)
	} else if (expression.kind === "coproduct") {
		if (source.kind === "coproduct") {
			const cases = Array.from(applyOptions(S, source, expression))
			if (cases.length === 0) {
				throw new Error("Empty case analysis")
			} else {
				// This line is magic
				return cases.reduce(unify)
			}
		} else {
			throw new Error("Invalid coproduct morphism")
		}
	} else {
		signalInvalidType(expression)
	}
}

function* applyOptions(
	S: Schema.Schema,
	source: Schema.Coproduct,
	{ options }: Mapping.Coproduct
): Generator<Schema.Type, void, undefined> {
	for (const key of getKeys(source.options)) {
		if (key in options) {
			yield applyExpressions(S, options[key], source.options[key])
		} else {
			throw new Error("Invalid coproduct case analysis")
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
