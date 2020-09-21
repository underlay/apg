import N3 from "n3.ts"

type pattern = { pattern: string; flags: string }
type iri = { id: string; type: "iri" }
type patternIri = iri & pattern
type literal = { id: string; type: "literal"; datatype: string }
type patternLiteral = literal & pattern

export namespace APG {
	export type Schema = Map<string, Type>
	export type Instance = Map<string, Value[]>

	export type Type = Label | Unit | Iri | Literal | Product | Coproduct

	export type Label = {
		id: string
		type: "label"
		key: string
		value: string
	}
	export type Unit = { id: string; type: "unit" }
	export type Iri = iri | patternIri

	export type Literal = literal | patternLiteral
	export type Product = { id: string; type: "product"; components: Component[] }
	export type Component = { type: "component"; key: string; value: string }
	export type Coproduct = { id: string; type: "coproduct"; options: Option[] }
	export type Option = { type: "option"; value: string }

	export type LabelValue = { id: string; type: "label"; value: Value }
	export type UnitValue = { id: string; type: "unit"; node: N3.BlankNode }
	export type IriValue = { id: string; type: "iri"; node: N3.NamedNode }
	export type LiteralValue = { id: string; type: "literal"; node: N3.Literal }
	export type ProductValue = {
		id: string
		type: "product"
		node: N3.BlankNode
		components: Value[]
	}
	export type CoproductValue = {
		id: string
		type: "coproduct"
		value: Value
	}
	export type Value =
		| LabelValue
		| UnitValue
		| IriValue
		| LiteralValue
		| ProductValue
		| CoproductValue
}

export const iriHasPattern = (expression: APG.Iri): expression is patternIri =>
	expression.hasOwnProperty("pattern")

export const literalHasPattern = (
	expression: APG.Literal
): expression is patternLiteral => expression.hasOwnProperty("pattern")

export const context = {
	id: "@id",
	type: "@type",
	"@vocab": "http://underlay.org/ns/",
	key: { "@type": "@id" },
	value: { "@type": "@id" },
	datatype: { "@type": "@id" },
	options: {
		"@reverse": "source",
	},
	components: {
		"@reverse": "source",
	},
}
