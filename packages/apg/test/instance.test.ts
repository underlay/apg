import { xsd } from "@underlay/namespaces"

import { Schema, Instance, validateInstance } from ".."

const xsdString = Instance.uri(xsd.string)

test("Tiny test", () => {
	const s = Schema.schema({ foo: Schema.uri() })
	const i: Instance.Instance<typeof s> = {
		foo: [Instance.uri("http://wow.neat")],
	}
	expect(validateInstance(s, i)).toBe(true)
})

test("Tiny test 2", () => {
	const s = Schema.schema({ foo: Schema.product({}) })
	const i: Instance.Instance<typeof s> = { foo: [Instance.unit()] }
	expect(validateInstance(s, i)).toBe(true)
})

test("Tiny test 2", () => {
	const s = Schema.schema({
		foo: Schema.product({ "foo/1": Schema.uri() }),
	})

	const i: Instance.Instance<typeof s> = {
		foo: [Instance.product(["foo/1"], [Instance.uri("http://wow.neat")])],
	}
	expect(validateInstance(s, i)).toBe(true)
})

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

	expect(validateInstance(s, i)).toBe(true)
})
