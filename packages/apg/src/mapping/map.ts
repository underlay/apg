import * as Mapping from "./mapping.js"
import * as Schema from "../schema/schema.js"
import * as Instance from "../instance/instance.js"

import { signalInvalidType, getKeys } from "../utils.js"

export function map(
	{ S, SI }: { S: Schema.Schema; SI: Instance.Instance },
	expression: Mapping.Expression,
	type: Schema.Type,
	value: Instance.Value
): [Schema.Type, Instance.Value] {
	if (expression.kind === "identity") {
		return [type, value]
	} else if (expression.kind === "identifier") {
		return [Schema.uri(), new Instance.Uri(expression.value)]
	} else if (expression.kind === "constant") {
		return [
			Schema.literal(expression.datatype),
			new Instance.Literal(expression.value),
		]
	} else if (expression.kind === "dereference") {
		const { key } = expression
		if (
			type.kind === "reference" &&
			type.key === key &&
			value.kind === "reference"
		) {
			if (key in SI && value.index in SI[key]) {
				return [S[key], SI[key][value.index]]
			} else {
				throw new Error("Invalid pointer dereference")
			}
		} else {
			throw new Error("Invalid pointer dereference")
		}
	} else if (expression.kind === "projection") {
		if (
			type.kind === "product" &&
			expression.key in type.components &&
			value.kind === "product"
		) {
			return [type.components[expression.key], value.get(type, expression.key)]
		} else {
			throw new Error("Invalid projection")
		}
	} else if (expression.kind === "match") {
		if (type.kind === "coproduct" && value.kind === "coproduct") {
			const key = value.key(type)
			if (key in expression.cases) {
				return map(
					{ S, SI },
					expression.cases[key],
					type.options[key],
					value.value
				)
			} else {
				throw new Error("Invalid case analysis")
			}
		} else {
			throw new Error("Invalid match morphism")
		}
	} else if (expression.kind === "tuple") {
		const types: Record<string, Schema.Type> = {}
		const values: Record<string, Instance.Value> = {}
		for (const key of getKeys(expression.slots)) {
			const slot = expression.slots[key]
			const [t, v] = map({ S, SI }, slot, type, value)
			types[key] = t
			values[key] = v
		}

		const product = Schema.product(types)
		return [product, Instance.product(product, values)]
	} else if (expression.kind === "injection") {
		return [
			Schema.coproduct({ [expression.key]: type }),
			new Instance.Coproduct(0, value),
		]
	} else {
		signalInvalidType(expression)
	}
}
