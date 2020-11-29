import { NamedNode } from "n3.ts"

import APG from "../es6/apg.js"
import { delta, fold, mapExpressions } from "../es6/mapping.js"
import { forEntries } from "../es6/utils.js"
import { validateValue } from "../es6/value.js"
import { validateExpressions } from "../es6/morphism.js"
import { getType, getValues } from "../es6/path.js"

const S: APG.Schema = {
	"http://example.com/a": {
		type: "product",
		components: {
			"http://example.com/a/a": {
				type: "product",
				components: {
					"http://example.com/a/a/a": { type: "uri" },
				},
			},
			"http://example.com/a/b": {
				type: "coproduct",
				options: {
					"http://example.com/a/b/a": { type: "unit" },
					"http://example.com/a/b/b": {
						type: "reference",
						value: "http://example.com/b",
					},
				},
			},
		},
	},
	"http://example.com/b": {
		type: "product",
		components: {
			"http://example.com/b/a": {
				type: "reference",
				value: "http://example.com/a",
			},
			"http://example.com/b/b": { type: "uri" },
		},
	},
}

const T: APG.Schema = {
	"http://example.com/0": {
		type: "product",
		components: {
			"http://example.com/0.0": {
				type: "product",
				components: {
					"http://example.com/0.0.0": { type: "uri" },
					"http://example.com/0.0.1": { type: "uri" },
				},
			},
			"http://example.com/0.1": {
				type: "reference",
				value: "http://example.com/1",
			},
		},
	},
	"http://example.com/1": {
		type: "product",
		components: {
			"http://example.com/1.0": {
				type: "reference",
				value: "http://example.com/0",
			},
			"http://example.com/1.1": { type: "uri" },
		},
	},
}

const M: APG.Mapping = {
	"http://example.com/a": {
		type: "map",
		source: "http://example.com/0",
		target: [],
		value: [
			{
				type: "tuple",
				slots: {
					"http://example.com/a/a": [
						{
							type: "tuple",
							slots: {
								"http://example.com/a/a/a": [
									{ type: "projection", key: "http://example.com/0.0" },
									{ type: "projection", key: "http://example.com/0.0.0" },
								],
							},
						},
					],
					"http://example.com/a/b": [
						{
							type: "injection",
							key: "http://example.com/a/b/b",
							value: [
								{ type: "projection", key: "http://example.com/0.1" },
								{ type: "dereference", key: "http://example.com/1" },
							],
						},
					],
				},
			},
		],
	},
	"http://example.com/b": {
		type: "map",
		source: "http://example.com/1",
		target: [],
		value: [
			{
				type: "tuple",
				slots: {
					"http://example.com/b/a": [
						{ type: "projection", key: "http://example.com/1.0" },
						{ type: "dereference", key: "http://example.com/0" },
					],
					"http://example.com/b/b": [
						{ type: "projection", key: "http://example.com/1.1" },
					],
				},
			},
		],
	},
}

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
		const source = getType(T, M[key].source, M[key].target)
		// console.log(key, source, image)
		expect(validateExpressions(T, M[key].value, source, image)).toBe(true)
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
		for (const value of getValues(T, I, m.source, m.target)) {
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
