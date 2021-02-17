import { Schema, Instance } from "@underlay/apg"

// import schemaSchema from "@underlay/apg/lib/schemas/schema/index"
// import { fromSchema } from "@underlay/apg/lib/schemas/schema/parse"

import { xsd } from "@underlay/namespaces"

import { encode, log } from ".."

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
		foo: [
			Instance.product(s.foo, { "foo/1": new Instance.Uri("http://wow.neat") }),
		],
		bar: [
			Instance.coproduct(s.bar, "bar/1", new Instance.Literal("hello world")),
			Instance.coproduct(
				s.bar,
				"bar/2",
				Instance.product(s.bar.options["bar/2"], {
					"bar/2/1": new Instance.Uri("http://cool.stuff"),
					"bar/2/2": new Instance.Reference(0),
				})
			),
		],
	})

	const bytes = encode(s, i)
	console.log("byte", bytes)
	log(s, bytes)
})

// test("Parse schema schema", () => {
// 	const i = fromSchema(schemaSchema)
// 	const bytes = encode(schemaSchema, i)
// 	log(schemaSchema, bytes)
// })
