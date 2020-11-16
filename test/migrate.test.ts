import { BlankNode, NamedNode } from "n3.ts"
import zip from "ziterable"

import APG from "../es6/apg.js"
import { delta, fold, map } from "../es6/mapping.js"
import { getId } from "../es6/utils.js"
import { validateValue } from "../es6/value.js"
import { validateMorphism } from "../es6/morphism.js"
import { getType, getValues } from "../es6/path.js"

const S: APG.Schema = [
	{
		type: "label",
		key: "http://example.com/a",
		value: {
			type: "product",
			components: [
				{
					type: "component",
					key: "http://example.com/a/a",
					value: {
						type: "product",
						components: [
							{
								type: "component",
								key: "http://example.com/a/a/a",
								value: { type: "iri" },
							},
						],
					},
				},
				{
					type: "component",
					key: "http://example.com/a/b",
					value: {
						type: "coproduct",
						options: [
							{
								type: "option",
								key: "http://example.com/a/b/a",
								value: { type: "unit" },
							},
							{
								type: "option",
								key: "http://example.com/a/b/b",
								value: { type: "reference", value: 1 },
							},
						],
					},
				},
			],
		},
	},
	{
		type: "label",
		key: "http://example.com/b/",
		value: {
			type: "product",
			components: [
				{
					type: "component",
					key: "http://example.com/b/a",
					value: { type: "reference", value: 0 },
				},
				{
					type: "component",
					key: "http://example.com/b/b",
					value: { type: "iri" },
				},
			],
		},
	},
]

const T: APG.Schema = [
	{
		type: "label",
		key: "http://example.com/0",
		value: {
			type: "product",
			components: [
				{
					type: "component",
					key: "http://example.com/0.0",
					value: {
						type: "product",
						components: [
							{
								type: "component",
								key: "http://example.com/0.0.0",
								value: { type: "iri" },
							},
							{
								type: "component",
								key: "http://example.com/0.0.1",
								value: { type: "iri" },
							},
						],
					},
				},
				{
					type: "component",
					key: "http://example.com/0.1",
					value: { type: "reference", value: 1 },
				},
			],
		},
	},
	{
		type: "label",
		key: "http://example.com/1",
		value: {
			type: "product",
			components: [
				{
					type: "component",
					key: "http://example.com/1.0",
					value: { type: "reference", value: 0 },
				},
				{
					type: "component",
					key: "http://example.com/1.1",
					value: { type: "iri" },
				},
			],
		},
	},
]

const M: APG.Mapping = [
	[
		[0, NaN],
		[1, NaN],
	],
	[
		{
			type: "tuple",
			componentKeys: ["http://example.com/a/a", "http://example.com/a/b"],
			morphisms: [
				{
					type: "tuple",
					componentKeys: ["http://example.com/a/a/a"],
					morphisms: [
						{
							type: "composition",
							object: {
								type: "product",
								components: [
									{
										type: "component",
										key: "http://example.com/0.0.0",
										value: { type: "iri" },
									},
									{
										type: "component",
										key: "http://example.com/0.0.1",
										value: { type: "iri" },
									},
								],
							},
							morphisms: [
								{
									type: "projection",
									componentKeys: [
										"http://example.com/0.0",
										"http://example.com/0.1",
									],
									index: 0,
								},
								{
									type: "projection",
									componentKeys: [
										"http://example.com/0.0.0",
										"http://example.com/0.0.1",
									],
									index: 0,
								},
							],
						},
					],
				},
				{
					type: "composition",
					object: { type: "reference", value: 1 },
					morphisms: [
						{
							type: "projection",
							componentKeys: [
								"http://example.com/0.0",
								"http://example.com/0.1",
							],
							index: 1,
						},
						{
							type: "composition",
							object: {
								type: "product",
								components: [
									{
										type: "component",
										key: "http://example.com/1.0",
										value: { type: "reference", value: 0 },
									},
									{
										type: "component",
										key: "http://example.com/1.1",
										value: { type: "iri" },
									},
								],
							},
							morphisms: [
								{ type: "dereference" },
								{
									type: "injection",
									optionKeys: [
										"http://example.com/a/b/a",
										"http://example.com/a/b/b",
									],
									index: 1,
								},
							],
						},
					],
				},
			],
		},
		{
			type: "tuple",
			componentKeys: ["http://example.com/b/a", "http://example.com/b/b"],
			morphisms: [
				{
					type: "composition",
					object: { type: "reference", value: 0 },
					morphisms: [
						{
							type: "projection",
							componentKeys: [
								"http://example.com/1.0",
								"http://example.com/1.1",
							],
							index: 0,
						},
						{ type: "dereference" },
					],
				},
				{
					type: "projection",
					componentKeys: ["http://example.com/1.0", "http://example.com/1.1"],
					index: 1,
				},
			],
		},
	],
]

const I: APG.Instance = [
	[
		new APG.Record(
			new BlankNode(getId()),
			["http://example.com/0.0", "http://example.com/0.1"],
			[
				new APG.Record(
					new BlankNode(getId()),
					["http://example.com/0.0.0", "http://example.com/0.0.1"],
					[
						new NamedNode("http://foo.com/neat"),
						new NamedNode("http://foo.com/wow"),
					]
				),
				new APG.Pointer(0, 1),
			]
		),
	],
	[
		new APG.Record(
			new BlankNode(getId()),
			["http://example.com/1.0", "http://example.com/1.1"],
			[new APG.Pointer(0, 0), new NamedNode("http://bar.org/fantastic")]
		),
	],
]

test("Validate morphisms", () => {
	const [m1, m2] = M
	for (const [path, morphism, { value: type }] of zip(m1, m2, S)) {
		const image = fold(m1, type, T)
		expect(validateMorphism(morphism, getType(T, path), image, T)).toBe(true)
	}
})

test("Validate instance type", () => {
	for (const [t, i] of zip(T, I)) {
		for (const value of i) {
			expect(validateValue(value, t.value)).toBe(true)
		}
	}
})

test("Validate instance image", () => {
	const [m1, m2] = M
	for (const [path, morphism, { value: type }] of zip(m1, m2, S)) {
		const image = fold(m1, type, T)
		for (const value of getValues(I, path)) {
			const result = map(morphism, value, I)
			expect(validateValue(result, image)).toBe(true)
		}
	}
})

test("Validate delta pullback", () => {
	const [m1, m2] = M
	for (const [{ value: type }, s] of zip(S, delta([m1, m2], S, T, I))) {
		for (const value of s) {
			expect(validateValue(value, type)).toBe(true)
		}
	}
})
