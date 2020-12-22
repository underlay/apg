import { Literal, NamedNode, xsd } from "n3.ts"

import {
	APG,
	delta,
	fold,
	mapExpressions,
	forEntries,
	validateValue,
	validateExpressions,
} from ".."

const S: APG.Schema = {
	"ex:n1": APG.product({
		"ex:n1/a": APG.literal(xsd.string),
		"ex:n1/b": APG.literal(xsd.integer),
		"ex:n1/c": APG.reference("ex:n2"),
	}),
	"ex:n2": APG.product({ "ex:n2/a": APG.uri() }),
}

const T: APG.Schema = {
	"ex:n0": APG.product({
		"ex:n0/a": APG.literal(xsd.string),
		"ex:n0/b": APG.literal(xsd.integer),
		"ex:n0/c": APG.uri(),
	}),
}

const M: APG.Mapping = {
	"ex:n1": APG.map("ex:n0", [
		APG.tuple({
			"ex:n1/a": [APG.projection("ex:n0/a")],
			"ex:n1/b": [APG.projection("ex:n0/b")],
			"ex:n1/c": [APG.identity()],
		}),
	]),
	"ex:n2": APG.map("ex:n0", [
		APG.tuple({ "ex:n2/a": [APG.projection("ex:n0/c")] }),
	]),
}

const xsdString = new NamedNode(xsd.string)
const xsdInteger = new NamedNode(xsd.integer)

const I: APG.Instance = {
	"ex:n0": [
		new APG.Record(
			["ex:n0/a", "ex:n0/b", "ex:n0/c"],
			[
				new Literal("foo", "", xsdString),
				new Literal("18", "", xsdInteger),
				new NamedNode("http://example.com/foo"),
			]
		),
		new APG.Record(
			["ex:n0/a", "ex:n0/b", "ex:n0/c"],
			[
				new Literal("bar", "", xsdString),
				new Literal("44", "", xsdInteger),
				new NamedNode("http://example.com/bar"),
			]
		),
		new APG.Record(
			["ex:n0/a", "ex:n0/b", "ex:n0/c"],
			[
				new Literal("baz", "", xsdString),
				new Literal("91", "", xsdInteger),
				new NamedNode("http://example.com/baz"),
			]
		),
	],
}

test("Validate morphisms", () => {
	for (const [key, type] of forEntries(S)) {
		const image = fold(M, S, T, type)
		const { source, value } = M[key]
		console.log(key, source, image)
		expect(validateExpressions(T, value, T[source], image)).toBe(true)
	}
})

test("Validate instance type", () => {
	for (const [key, values] of forEntries(I)) {
		for (const value of values) {
			expect(validateValue(T[key], value)).toBe(true)
		}
	}
})

test("Validate instance image", () => {
	for (const [key, type] of forEntries(S)) {
		const m = M[key]
		const image = fold(M, S, T, type)
		for (const value of I[m.source]) {
			const result = mapExpressions(m.value, value, I, T)
			expect(validateValue(image, result)).toBe(true)
		}
	}
})

test("Validate delta pullback", () => {
	for (const [key, values] of forEntries(delta(M, S, T, I))) {
		console.log("key", key)
		for (const value of values) {
			console.log("value", value)
			expect(validateValue(S[key], value)).toBe(true)
		}
	}
})
