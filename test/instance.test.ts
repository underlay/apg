import { Literal, NamedNode, xsd } from "n3.ts"
import { APG, validateInstance } from "../es6/index.js"

const xsdString = new NamedNode(xsd.string)

test("Tiny test", () => {
	const s = APG.schema({ foo: APG.uri() })
	const i: APG.Instance<typeof s> = { foo: [new NamedNode("http://wow.neat")] }
	expect(validateInstance(s, i)).toBe(true)
})

test("Tiny test 2", () => {
	const s = APG.schema({ foo: APG.product({}) })
	const i: APG.Instance<typeof s> = { foo: [APG.unit()] }
	expect(validateInstance(s, i)).toBe(true)
})

test("Tiny test 2", () => {
	const s = APG.schema({
		foo: APG.product({ "foo/1": APG.uri() }),
	})

	const i: APG.Instance<typeof s> = {
		foo: [new APG.Record(["foo/1"], [new NamedNode("http://wow.neat")])],
	}
	expect(validateInstance(s, i)).toBe(true)
})

test("Simple test", () => {
	const s = APG.schema({
		foo: APG.product({ "foo/1": APG.uri() }),
		bar: APG.coproduct({
			"bar/1": APG.literal(xsd.string),
			"bar/2": APG.product({
				"bar/2/1": APG.uri(),
				"bar/2/2": APG.reference("foo"),
			}),
		}),
	})

	const i = APG.instance(s, {
		foo: [new APG.Record(["foo/1"], [new NamedNode("http://wow.neat")])],
		bar: [
			new APG.Variant(
				["bar/1", "bar/2"],
				"bar/1",
				new Literal("hello world", "", xsdString)
			),
			new APG.Variant(
				["bar/1", "bar/2"],
				"bar/2",
				new APG.Record(
					["bar/2/1", "bar/2/2"],
					[new NamedNode("http://cool.stuff"), new APG.Pointer(0)]
				)
			),
		],
	})

	expect(validateInstance(s, i)).toBe(true)
})
