import * as t from "io-ts"

import { Schema, forEntries, forType } from "@underlay/apg"

export const reference: t.Type<Schema.Reference> = t.type({
	type: t.literal("reference"),
	value: t.string,
})

export const uri: t.Type<Schema.Uri> = t.type({ type: t.literal("uri") })

export const literal: t.Type<Schema.Literal> = t.type({
	type: t.literal("literal"),
	datatype: t.string,
})

export const product: t.Type<Schema.Product> = t.recursion("Product", () =>
	t.type({
		type: t.literal("product"),
		components: t.record(t.string, type),
	})
)

export const coproduct: t.Type<Schema.Coproduct> = t.recursion(
	"Coproduct",
	() =>
		t.type({
			type: t.literal("coproduct"),
			options: t.record(t.string, type),
		})
)

export const type: t.Type<Schema.Type> = t.recursion("Type", () =>
	t.union([reference, uri, literal, product, coproduct])
)

const labels = t.record(t.string, type)

const codec: t.Type<Schema.Schema> = new t.Type(
	"Schema",
	labels.is,
	(input: unknown, context: t.Context) => {
		const result = labels.validate(input, context)
		if (result._tag === "Left") {
			return result
		}

		// Check that references have valid referents
		for (const [_, label] of forEntries(result.right)) {
			for (const [type] of forType(label)) {
				if (type.type === "reference") {
					if (type.value in result.right) {
						continue
					} else {
						return t.failure(type, context, "Invalid reference")
					}
				}
			}
		}

		return result
	},
	t.identity
)

export default codec