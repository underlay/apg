import { xsd } from "@underlay/namespaces"

import {
	Schema,
	Instance,
	Mapping,
	delta,
	fold,
	mapExpressions,
	forEntries,
	validateValue,
	validateExpressions,
} from ".."

const S: Schema.Schema = {
	"ex:n1": Schema.product({
		"ex:n1/a": Schema.literal(xsd.string),
		"ex:n1/b": Schema.literal(xsd.integer),
		"ex:n1/c": Schema.reference("ex:n2"),
	}),
	"ex:n2": Schema.product({ "ex:n2/a": Schema.uri() }),
}

const T: Schema.Schema = {
	"ex:n0": Schema.product({
		"ex:n0/a": Schema.literal(xsd.string),
		"ex:n0/b": Schema.literal(xsd.integer),
		"ex:n0/c": Schema.uri(),
	}),
}

const M: Mapping.Mapping = {
	"ex:n1": Mapping.map("ex:n0", [
		Mapping.tuple({
			"ex:n1/a": [Mapping.projection("ex:n0/a")],
			"ex:n1/b": [Mapping.projection("ex:n0/b")],
			"ex:n1/c": [],
		}),
	]),
	"ex:n2": Mapping.map("ex:n0", [
		Mapping.tuple({ "ex:n2/a": [Mapping.projection("ex:n0/c")] }),
	]),
}

const xsdString = Instance.uri(xsd.string)
const xsdInteger = Instance.uri(xsd.integer)

const I: Instance.Instance = {
	"ex:n0": [
		Instance.product(
			["ex:n0/a", "ex:n0/b", "ex:n0/c"],
			[
				Instance.literal("foo", xsdString),
				Instance.literal("18", xsdInteger),
				Instance.uri("http://example.com/foo"),
			]
		),
		Instance.product(
			["ex:n0/a", "ex:n0/b", "ex:n0/c"],
			[
				Instance.literal("bar", xsdString),
				Instance.literal("44", xsdInteger),
				Instance.uri("http://example.com/bar"),
			]
		),
		Instance.product(
			["ex:n0/a", "ex:n0/b", "ex:n0/c"],
			[
				Instance.literal("baz", xsdString),
				Instance.literal("91", xsdInteger),
				Instance.uri("http://example.com/baz"),
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
