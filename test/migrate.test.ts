import { NamedNode } from "n3.ts"

import APG from "../es6/apg.js"
import { delta, fold, mapExpressions } from "../es6/mapping.js"
import { forEntries } from "../es6/utils.js"
import { validateValue } from "../es6/value.js"
import { validateExpressions } from "../es6/morphism.js"

const S = APG.schema({
	"http://example.com/a": APG.product({
		"http://example.com/a/a": APG.product({
			"http://example.com/a/a/a": APG.uri(),
		}),
		"http://example.com/a/b": APG.coproduct({
			"http://example.com/a/b/a": APG.product({}),
			"http://example.com/a/b/b": APG.reference("http://example.com/b"),
		}),
	}),
	"http://example.com/b": APG.product({
		"http://example.com/b/a": APG.reference("http://example.com/a"),
		"http://example.com/b/b": APG.uri(),
	}),
})

const T = APG.schema({
	"http://example.com/0": APG.product({
		"http://example.com/0.0": APG.product({
			"http://example.com/0.0.0": APG.uri(),
			"http://example.com/0.0.1": APG.uri(),
		}),
		"http://example.com/0.1": APG.reference("http://example.com/1"),
	}),
	"http://example.com/1": APG.product({
		"http://example.com/1.0": APG.reference("http://example.com/0"),
		"http://example.com/1.1": APG.uri(),
	}),
})

const M = APG.mapping({
	"http://example.com/a": APG.map("http://example.com/0", [
		APG.tuple({
			"http://example.com/a/a": [
				APG.tuple({
					"http://example.com/a/a/a": [
						APG.projection("http://example.com/0.0"),
						APG.projection("http://example.com/0.0.0"),
					],
				}),
			],
			"http://example.com/a/b": [
				APG.injection("http://example.com/a/b/b", [
					APG.projection("http://example.com/0.1"),
					APG.dereference("http://example.com/1"),
				]),
			],
		}),
	]),
	"http://example.com/b": APG.map("http://example.com/1", [
		APG.tuple({
			"http://example.com/b/a": [
				APG.projection("http://example.com/1.0"),
				APG.dereference("http://example.com/0"),
			],
			"http://example.com/b/b": [APG.projection("http://example.com/1.1")],
		}),
	]),
})

const I: APG.Instance = {
	"http://example.com/0": [
		new APG.Record(
			["http://example.com/0.0", "http://example.com/0.1"],
			[
				new APG.Record(
					["http://example.com/0.0.0", "http://example.com/0.0.1"],
					[
						new NamedNode("http://foo.com/neat"),
						new NamedNode("http://foo.com/wow"),
					]
				),
				new APG.Pointer(0),
			]
		),
	],
	"http://example.com/1": [
		new APG.Record(
			["http://example.com/1.0", "http://example.com/1.1"],
			[new APG.Pointer(0), new NamedNode("http://bar.org/fantastic")]
		),
	],
}

test("Validate morphisms", () => {
	for (const [key, type] of forEntries(S)) {
		const image = fold(M, S, T, type)
		const { value, source } = M[key]
		// const source = getType(T, M[key].source)
		// console.log(key, source, image)
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
		for (const value of values) {
			expect(validateValue(S[key], value)).toBe(true)
		}
	}
})
