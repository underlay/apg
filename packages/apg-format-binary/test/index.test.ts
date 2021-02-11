import { Schema, Instance } from "@underlay/apg"

// import schemaSchema from "@underlay/apg/lib/schemas/schema/index"
// import { fromSchema } from "@underlay/apg/lib/schemas/schema/parse"

import { xsd } from "@underlay/namespaces"

import { encode, log } from ".."

const xsdString = Instance.uri(xsd.string)

test("Simple test", () => {
	const s = Schema.schema({
		foo: Schema.product({ "foo/1": Schema.uri() }),
		bar: Schema.coproduct({
			"bar/1": Schema.literal(xsd.string),
			"bar/2": Schema.product({
				"bar/2/1": Schema.uri(),
				"bar/2/2": Schema.reference("foo"),
			}),
		}),
	})

	const i = Instance.instance(s, {
		foo: [Instance.product(["foo/1"], [Instance.uri("http://wow.neat")])],
		bar: [
			Instance.coproduct(
				["bar/1", "bar/2"],
				"bar/1",
				Instance.literal("hello world", xsdString)
			),
			Instance.coproduct(
				["bar/1", "bar/2"],
				"bar/2",
				Instance.product(
					["bar/2/1", "bar/2/2"],
					[Instance.uri("http://cool.stuff"), Instance.reference(0)]
				)
			),
		],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

// test("Parse schema schema", () => {
// 	const i = fromSchema(schemaSchema)
// 	const bytes = encode(schemaSchema, i)
// 	log(schemaSchema, bytes)
// })
