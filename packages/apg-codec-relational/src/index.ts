import * as t from "io-ts"

import { Schema, forEntries, getKeys } from "@underlay/apg"
import { ul } from "@underlay/namespaces"

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
			[ul.none]: t.type({
				type: t.literal("product"),
				components: t.type({}),
			}),
			[ul.some]: property,
		}),
	}),
])

const type = t.type({
	type: t.literal("product"),
	components: t.record(t.string, optionalProperty),
})

const labels = t.record(t.string, type)

const isProperty = (type: Schema.Type): type is t.TypeOf<typeof property> =>
	type.type === "reference" || type.type === "uri" || type.type === "literal"

const isOptionalProperty = (
	type: Schema.Type
): type is t.TypeOf<typeof optionalProperty> =>
	isProperty(type) ||
	(type.type === "coproduct" &&
		getKeys(type).length === 2 &&
		ul.none in type.options &&
		Schema.isUnit(type.options[ul.none]) &&
		ul.some in type.options &&
		isProperty(type.options[ul.some]))

export function isRelationalSchema(
	input: Schema.Schema
): input is t.TypeOf<typeof labels> {
	for (const [{}, type] of forEntries(input)) {
		if (type.type === "product") {
			for (const [_, value] of forEntries(type.components)) {
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

const codec = new t.Type<
	t.TypeOf<typeof labels>,
	t.TypeOf<typeof labels>,
	Schema.Schema
>(
	"Relational",
	(input: unknown): input is t.TypeOf<typeof labels> => {
		return labels.is(input) && isRelationalSchema(input)
	},
	(input: Schema.Schema, context: t.Context) => {
		if (isRelationalSchema(input)) {
			return t.success(input)
		} else {
			return t.failure(input, context)
		}
	},
	t.identity
)

export default codec
