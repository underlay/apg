import { NamedNode } from "n3.ts"
import zip from "ziterable"

import APG from "../es6/apg.js"
import { delta, fold, mapExpressions } from "../es6/mapping.js"
import { getID } from "../es6/utils.js"
import { validateValue } from "../es6/value.js"
import { validateExpressions } from "../es6/morphism.js"
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
		key: "http://example.com/b",
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
	{
		type: "map",
		key: "http://example.com/a",
		source: "http://example.com/0",
		target: [],
		value: [
			{
				type: "tuple",
				slots: [
					{
						type: "slot",
						key: "http://example.com/a/a",
						value: [
							{
								type: "tuple",
								slots: [
									{
										type: "slot",
										key: "http://example.com/a/a/a",
										value: [
											{ type: "projection", key: "http://example.com/0.0" },
											{ type: "projection", key: "http://example.com/0.0.0" },
										],
									},
								],
							},
						],
					},
					{
						type: "slot",
						key: "http://example.com/a/b",
						value: [
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
				],
			},
		],
	},
	{
		type: "map",
		key: "http://example.com/b",
		source: "http://example.com/1",
		target: [],
		value: [
			{
				type: "tuple",
				slots: [
					{
						type: "slot",
						key: "http://example.com/b/a",
						value: [
							{ type: "projection", key: "http://example.com/1.0" },
							{ type: "dereference", key: "http://example.com/0" },
						],
					},
					{
						type: "slot",
						key: "http://example.com/b/b",
						value: [{ type: "projection", key: "http://example.com/1.1" }],
					},
				],
			},
		],
	},
]

const id = getID()

const I: APG.Instance = [
	[
		new APG.Record(
			id(),
			["http://example.com/0.0", "http://example.com/0.1"],
			[
				new APG.Record(
					id(),
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
	[
		new APG.Record(
			id(),
			["http://example.com/1.0", "http://example.com/1.1"],
			[new APG.Pointer(0), new NamedNode("http://bar.org/fantastic")]
		),
	],
]

test("Validate morphisms", () => {
	for (const { key, value: type } of S) {
		const m = M.find((m) => m.key === key)!
		const image = fold(M, S, T, type)
		const source = getType(T, m.source, m.target)
		expect(validateExpressions(T, m.value, source, image)).toBe(true)
	}
})

test("Validate instance type", () => {
	for (const [t, i] of zip(T, I)) {
		for (const value of i) {
			expect(validateValue(t.value, value)).toBe(true)
		}
	}
})

test("Validate instance image", () => {
	const [m1, m2] = M
	const id = getID()
	for (const { key, value: type } of S) {
		const m = M.find((m) => m.key === key)!
		const image = fold(M, S, T, type)
		for (const value of getValues(T, I, m.source, m.target)) {
			const result = mapExpressions(m.value, value, I, T, id)
			expect(validateValue(image, result)).toBe(true)
		}
	}
})

test("Validate delta pullback", () => {
	const [m1, m2] = M
	for (const [{ value: type }, s] of zip(S, delta([m1, m2], S, T, I))) {
		for (const value of s) {
			expect(validateValue(type, value)).toBe(true)
		}
	}
})
