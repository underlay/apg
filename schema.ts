import N3 from "n3.ts"

export type APG = Label[]

export type Label = {
	id: string
	type: "label"
	key: string
	value: Type
}

export type Type =
	| ReferenceType
	| NilType
	| IriType
	| LiteralType
	| ProductType
	| CoproductType

type Pattern = {} | { pattern: string; flags: string }
export type ReferenceType = { id: string }
export type NilType = { type: "nil" }
export type IriType = { type: "iri" } & Pattern
export type LiteralType = { type: "literal"; datatype: string } & Pattern
export type ProductType = { type: "product"; components: Component[] }
export type Component = { type: "component"; key: string; value: Type }
export type CoproductType = { type: "coproduct"; options: Option[] }
export type Option = { type: "option"; value: Type }

export const context = {
	id: "@id",
	type: "@type",
	"@vocab": "http://underlay.org/ns/",
	key: { "@type": "@id" },
	datatype: { "@type": "@id" },
	options: {
		"@reverse": "source",
	},
	components: {
		"@reverse": "source",
	},
}

export const isReference = (expression: Type): expression is ReferenceType =>
	expression.hasOwnProperty("id")

export const iriHasPattern = (
	expression: IriType
): expression is { type: "iri"; pattern: string; flags: null | string } =>
	expression.hasOwnProperty("pattern")

export const literalHasPattern = (
	expression: LiteralType
): expression is {
	type: "literal"
	datatype: string
	pattern: string
	flags: null | string
} => expression.hasOwnProperty("pattern")

export class Tree {
	private readonly children: Map<string, Value>
	constructor(
		readonly node: N3.BlankNode,
		children: Iterable<[string, Value]>
	) {
		this.children = children instanceof Map ? children : new Map(children)
	}
	public get termType() {
		return "Tree"
	}
	public get value() {
		return this.node.value
	}
	public get size() {
		return this.children.size
	}
	public [Symbol.iterator]() {
		return this.children[Symbol.iterator]()
	}
	public get(node: string) {
		return this.children.get(node)
	}
}

export type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Tree
