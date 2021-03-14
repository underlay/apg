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
	isTypeEqual,
} from ".."

const S = Schema.schema({
	"ex:n1": Schema.product({
		"ex:n1/a": Schema.literal(xsd.string),
		"ex:n1/b": Schema.literal(xsd.integer),
		"ex:n1/c": Schema.reference("ex:n2"),
	}),
	"ex:n2": Schema.product({ "ex:n2/a": Schema.uri() }),
})

const T = Schema.schema({
	"ex:n0": Schema.product({
		"ex:n0/a": Schema.literal(xsd.string),
		"ex:n0/b": Schema.literal(xsd.integer),
		"ex:n0/c": Schema.uri(),
	}),
})

const M = Mapping.mapping({
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
})

const TI: Instance.Instance<typeof T> = {
	"ex:n0": [
		Instance.product(T["ex:n0"], {
			"ex:n0/a": new Instance.Literal("foo"),
			"ex:n0/b": new Instance.Literal("18"),
			"ex:n0/c": new Instance.Uri("http://example.com/foo"),
		}),
		Instance.product(T["ex:n0"], {
			"ex:n0/a": new Instance.Literal("bar"),
			"ex:n0/b": new Instance.Literal("44"),
			"ex:n0/c": new Instance.Uri("http://example.com/bar"),
		}),
		Instance.product(T["ex:n0"], {
			"ex:n0/a": new Instance.Literal("baz"),
			"ex:n0/b": new Instance.Literal("91"),
			"ex:n0/c": new Instance.Uri("http://example.com/baz"),
		}),
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
	for (const [key, values] of forEntries(TI)) {
		for (const value of values) {
			expect(validateValue(T[key], (value as unknown) as Instance.Value)).toBe(
				true
			)
		}
	}
})

test("Validate instance image", () => {
	for (const [key, type] of forEntries(S)) {
		const m = M[key]
		const image = fold(M, S, T, type)
		for (const value of TI[m.source]) {
			const [resultType, resultValue] = mapExpressions(
				{ S: T, SI: TI },
				m.value,
				T[m.source],
				value
			)
			expect(isTypeEqual(image, resultType)).toBe(true)
			expect(validateValue(image, resultValue)).toBe(true)
		}
	}
})

test("Validate delta pullback", () => {
	for (const [key, values] of forEntries(delta(M, S, T, TI))) {
		console.log("key", key)
		for (const value of values) {
			console.log("value", value)
			expect(validateValue(S[key], value)).toBe(true)
		}
	}
})
