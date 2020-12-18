import * as t from "io-ts"

import { APG, forType, forEntries } from "../index.js"

export const reference: t.Type<APG.Reference> = t.type({
	type: t.literal("reference"),
	value: t.string,
})

export const uri: t.Type<APG.Uri> = t.type({ type: t.literal("uri") })

export const literal: t.Type<APG.Literal> = t.type({
	type: t.literal("literal"),
	datatype: t.string,
})

export const product: t.Type<APG.Product> = t.recursion("Product", () =>
	t.type({
		type: t.literal("product"),
		components: t.record(t.string, type),
	})
)

export const coproduct: t.Type<APG.Coproduct> = t.recursion("Coproduct", () =>
	t.type({
		type: t.literal("coproduct"),
		options: t.record(t.string, type),
	})
)

export const type: t.Type<APG.Type> = t.recursion("Type", () =>
	t.union([reference, uri, literal, product, coproduct])
)

const labels = t.record(t.string, type)

const codec: t.Type<APG.Schema> = new t.Type(
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
