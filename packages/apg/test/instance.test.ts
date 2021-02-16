import { xsd } from "@underlay/namespaces"

import { Schema, Instance, validateInstance } from ".."

test("Tiny test", () => {
	const s = Schema.schema({ foo: Schema.uri() })
	const i: Instance.Instance<typeof s> = {
		foo: [Instance.uri(s.foo, "http://wow.neat")],
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
		foo: [
			Instance.product(s.foo, {
				"foo/1": Instance.uri(s.foo.components["foo/1"], "http://wow.neat"),
			}),
		],
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
		foo: [
			Instance.product(s.foo, {
				"foo/1": Instance.uri(s.foo.components["foo/1"], "http://wow.neat"),
			}),
		],
		bar: [
			Instance.coproduct(
				s.bar,
				"bar/1",
				Instance.literal(s.bar.options["bar/1"], "hello world")
			),
			Instance.coproduct(
				s.bar,
				"bar/2",
				Instance.product(s.bar.options["bar/2"], {
					"bar/2/1": Instance.uri(
						s.bar.options["bar/2"].components["bar/2/1"],
						"http://cool.stuff"
					),
					"bar/2/2": Instance.reference(
						s.bar.options["bar/2"].components["bar/2/2"],
						0
					),
				})
			),
		],
	})

	expect(validateInstance(s, i)).toBe(true)
})
