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
	isTypeAssignable,
} from ".."

const S = Schema.schema({
	"http://example.com/a": Schema.product({
		"http://example.com/a/a": Schema.product({
			"http://example.com/a/a/a": Schema.uri(),
		}),
		"http://example.com/a/b": Schema.coproduct({
			"http://example.com/a/b/a": Schema.product({}),
			"http://example.com/a/b/b": Schema.reference("http://example.com/b"),
		}),
	}),
	"http://example.com/b": Schema.product({
		"http://example.com/b/a": Schema.reference("http://example.com/a"),
		"http://example.com/b/b": Schema.uri(),
	}),
})

const T = Schema.schema({
	"http://example.com/0": Schema.product({
		"http://example.com/0.0": Schema.product({
			"http://example.com/0.0.0": Schema.uri(),
			"http://example.com/0.0.1": Schema.uri(),
		}),
		"http://example.com/0.1": Schema.reference("http://example.com/1"),
	}),
	"http://example.com/1": Schema.product({
		"http://example.com/1.0": Schema.reference("http://example.com/0"),
		"http://example.com/1.1": Schema.uri(),
	}),
})

const M = Mapping.mapping({
	"http://example.com/a": Mapping.map("http://example.com/0", [
		Mapping.tuple({
			"http://example.com/a/a": [
				Mapping.tuple({
					"http://example.com/a/a/a": [
						Mapping.projection("http://example.com/0.0"),
						Mapping.projection("http://example.com/0.0.0"),
					],
				}),
			],
			"http://example.com/a/b": [
				Mapping.projection("http://example.com/0.1"),
				Mapping.dereference("http://example.com/1"),
				Mapping.injection("http://example.com/a/b/b"),
			],
		}),
	]),
	"http://example.com/b": Mapping.map("http://example.com/1", [
		Mapping.tuple({
			"http://example.com/b/a": [
				Mapping.projection("http://example.com/1.0"),
				Mapping.dereference("http://example.com/0"),
			],
			"http://example.com/b/b": [Mapping.projection("http://example.com/1.1")],
		}),
	]),
})

const TI: Instance.Instance = {
	"http://example.com/0": [
		Instance.product(T["http://example.com/0"], {
			"http://example.com/0.0": Instance.product(
				T["http://example.com/0"].components["http://example.com/0.0"],
				{
					"http://example.com/0.0.0": Instance.uri(
						T["http://example.com/0"].components["http://example.com/0.0"]
							.components["http://example.com/0.0.0"],
						"http://foo.com/neat"
					),
					"http://example.com/0.0.1": Instance.uri(
						T["http://example.com/0"].components["http://example.com/0.0"]
							.components["http://example.com/0.0.1"],
						"http://foo.com/wow"
					),
				}
			),
			"http://example.com/0.1": Instance.reference(
				T["http://example.com/0"].components["http://example.com/0.1"],
				0
			),
		}),
	],
	"http://example.com/1": [
		Instance.product(T["http://example.com/1"], {
			"http://example.com/1.0": Instance.reference(
				T["http://example.com/1"].components["http://example.com/1.0"],
				0
			),
			"http://example.com/1.1": Instance.uri(
				T["http://example.com/1"].components["http://example.com/1.1"],
				"http://bar.org/fantastic"
			),
		}),
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
	for (const [key, values] of forEntries(TI)) {
		for (const value of values) {
			expect(validateValue(T[key], value)).toBe(true)
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
			expect(isTypeAssignable(resultType, image)).toBe(true)
			expect(validateValue(resultType, resultValue)).toBe(true)
		}
	}
})

test("Validate delta pullback", () => {
	for (const [key, values] of forEntries(delta(M, S, T, TI))) {
		for (const value of values) {
			expect(validateValue(S[key], value)).toBe(true)
		}
	}
})
