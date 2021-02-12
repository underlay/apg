import * as t from "io-ts"

import { Schema, forEntries, getKeys } from "@underlay/apg"
import { ul } from "@underlay/namespaces"

const property = t.union([
	t.type({ kind: t.literal("literal"), datatype: t.string }),
	t.type({ kind: t.literal("uri") }),
])

const optionalProperty = t.union([
	property,
	t.type({
		kind: t.literal("coproduct"),
		options: t.type({
			[ul.none]: t.type({
				kind: t.literal("product"),
				components: t.type({}),
			}),
			[ul.some]: property,
		}),
	}),
])

const type = t.type({
	kind: t.literal("product"),
	components: t.record(t.string, optionalProperty),
})

const labels = t.record(t.string, type)

export type Property = t.TypeOf<typeof property>

export const isProperty = (type: Schema.Type): type is Property =>
	type.kind === "uri" || type.kind === "literal"

export type OptionalProperty = t.TypeOf<typeof optionalProperty>

export const isOptionalProperty = (
	type: Schema.Type
): type is OptionalProperty =>
	isProperty(type) ||
	(type.kind === "coproduct" &&
		getKeys(type).length === 2 &&
		ul.none in type.options &&
		Schema.isUnit(type.options[ul.none]) &&
		ul.some in type.options &&
		isProperty(type.options[ul.some]))

export function isTableSchema(
	input: Schema.Schema
): input is t.TypeOf<typeof labels> {
	for (const [{}, type] of forEntries(input)) {
		if (type.kind === "product") {
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
	"Table",
	(input: unknown): input is t.TypeOf<typeof labels> => {
		return labels.is(input) && isTableSchema(input)
	},
	(input: Schema.Schema, context: t.Context) => {
		if (isTableSchema(input)) {
			return t.success(input)
		} else {
			return t.failure(input, context)
		}
	},
	t.identity
)

export default codec
