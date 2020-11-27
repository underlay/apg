import * as t from "io-ts"

import APG from "../apg.js"
import { ns } from "../index.js"

import { none, some } from "../namespace.js"
import { getEntries } from "../utils.js"

const property = t.union([
	t.type({ type: t.literal("reference"), value: t.string }),
	t.type({ type: t.literal("literal"), datatype: t.string }),
	t.type({ type: t.literal("uri") }),
])

const optionalProperty = t.union([
	property,
	t.type({
		type: t.literal("coproduct"),
		options: t.type({
			[ns.none]: t.type({ type: t.literal("unit") }),
			[ns.some]: property,
		}),
	}),
])

const type = t.union([
	t.type({ type: t.literal("unit") }),
	t.type({
		type: t.literal("product"),
		components: t.record(t.string, optionalProperty),
	}),
])

const labels = t.record(t.string, type)

const isProperty = (type: APG.Type): type is t.TypeOf<typeof property> =>
	type.type === "reference" || type.type === "uri" || type.type === "literal"

const isOptionalProperty = (
	type: APG.Type
): type is t.TypeOf<typeof optionalProperty> =>
	isProperty(type) ||
	(type.type === "coproduct" &&
		ns.none in type.options &&
		type.options[ns.none].type === "unit" &&
		ns.some in type.options &&
		isProperty(type.options[ns.some]))

export function isRelationalSchema(
	input: APG.Schema
): input is t.TypeOf<typeof labels> {
	for (const [key, type] of getEntries(input)) {
		if (type.type === "unit") {
			continue
		} else if (type.type === "product") {
			for (const [_, value] of getEntries(type.components)) {
				if (isOptionalProperty(value)) {
					continue
				} else {
					return false
				}
			}
		} else {
			return false
		}
	}
	return true
}

export const relationalSchema = new t.Type<
	t.TypeOf<typeof labels>,
	t.TypeOf<typeof labels>,
	APG.Schema
>(
	"Relational",
	(input: unknown): input is t.TypeOf<typeof labels> => {
		return labels.is(input)
	},
	(input: APG.Schema, context: t.Context) => {
		if (isRelationalSchema(input)) {
			return t.success(input)
		} else {
			return t.failure(input, context)
		}
	},
	t.identity
)
