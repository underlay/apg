import zip from "ziterable"
import APG from "./apg.js"

import { isTypeAssignable, unify } from "./type.js"
import { signalInvalidType } from "./utils.js"

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
	} else if (expression.type === "initial") {
		throw new Error("Not implemented")
	} else if (expression.type === "terminal") {
		return Object.freeze({ type: "unit" })
	} else if (expression.type === "identifier") {
		return Object.freeze({ type: "iri" })
	} else if (expression.type === "constant") {
		return Object.freeze({
			type: "literal",
			datatype: expression.value.datatype.value,
		})
	} else if (expression.type === "dereference") {
		if (
			source.type === "reference" &&
			source.value in S &&
			S[source.value].key === expression.key
		) {
			return S[source.value].value
		} else {
			throw new Error("Invalid dereference morphism")
		}
	} else if (expression.type === "projection") {
		if (source.type === "product") {
			const component = source.components.find(
				({ key }) => key === expression.key
			)
			if (component === undefined) {
				throw new Error("Invalid projection morphism")
			} else {
				return component.value
			}
		} else {
			throw new Error("Invalid projection morphism")
		}
	} else if (expression.type === "injection") {
		return Object.freeze({
			type: "coproduct",
			options: Object.freeze([applyOption(S, source, expression)]),
		})
	} else if (expression.type === "tuple") {
		return Object.freeze({
			type: "product",
			components: Object.freeze(
				Array.from(applyComponents(S, source, expression))
			),
		})
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
		// } else if (expression.type === "composition") {
		// 	const [a, b] = expression.morphisms
		// 	return apply(S, b, apply(S, a, source))
	} else {
		signalInvalidType(expression)
	}
}

function applyOption(
	S: APG.Schema,
	source: APG.Type,
	{ value, key }: APG.Injection
): APG.Option {
	return Object.freeze({
		type: "option",
		key,
		value: value.reduce(
			(type, expression) => apply(S, expression, type),
			source
		),
	})
}

function* applyComponents(
	S: APG.Schema,
	source: APG.Type,
	{ slots }: APG.Tuple
): Generator<APG.Component, void, undefined> {
	for (const { key, value } of slots) {
		yield Object.freeze({
			type: "component",
			key,
			value: applyExpressions(S, value, source),
		})
	}
}

function* applyCases(
	S: APG.Schema,
	source: APG.Coproduct,
	{ cases }: APG.Match
): Generator<APG.Type, void, undefined> {
	for (const [option, { key, value }] of zip(source.options, cases)) {
		if (option.key !== key) {
			throw new Error("Invalid case analysis")
		}
		yield applyExpressions(S, value, source)
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
