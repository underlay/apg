import * as N3 from "n3.ts"
import { DataModel, rdf } from "n3.ts"

import canonize from "rdf-canonize"

import APG from "./apg.js"

import * as ns from "./namespace.js"

import { signalInvalidType } from "./utils.js"

const rdfType = new N3.NamedNode(rdf.type)

const ul = {
	label: new N3.NamedNode(ns.label),
	key: new N3.NamedNode(ns.key),
	value: new N3.NamedNode(ns.value),
	reference: new N3.NamedNode(ns.reference),
	unit: new N3.NamedNode(ns.unit),
	iri: new N3.NamedNode(ns.iri),
	literal: new N3.NamedNode(ns.literal),
	datatype: new N3.NamedNode(ns.datatype),
	product: new N3.NamedNode(ns.product),
	component: new N3.NamedNode(ns.component),
	coproduct: new N3.NamedNode(ns.coproduct),
	option: new N3.NamedNode(ns.option),
	source: new N3.NamedNode(ns.source),
}

export function serializeSchemaString(schema: APG.Schema): string {
	const quads: DataModel["Quad"][] = []
	for (const quad of serializeSchema(schema)) {
		quads.push(quad.toJSON())
	}
	return canonize.canonizeSync(quads, { algorithm: "URDNA2015" })
}

export function* serializeSchema(
	schema: APG.Schema
): Generator<N3.Quad, void, undefined> {
	const typeIds: Map<APG.Type, N3.BlankNode> = new Map()
	const counter = { value: 0 }
	yield* generateSchema(schema, typeIds, counter)
}

function* generateType(
	type: APG.Type,
	types: Map<APG.Type, N3.BlankNode>,
	counter: { value: number }
): Generator<N3.Quad, N3.BlankNode, undefined> {
	if (types.has(type)) {
		return types.get(type)!
	}

	const subject = new N3.BlankNode(`t-${counter.value++}`)
	types.set(type, subject)

	yield new N3.Quad(subject, rdfType, ul[type.type])

	if (type.type === "reference") {
		const object = new N3.BlankNode(`l-${type.value}`)
		yield new N3.Quad(subject, ul.value, object)
	} else if (type.type === "unit") {
	} else if (type.type === "iri") {
	} else if (type.type === "literal") {
		yield new N3.Quad(subject, ul.datatype, new N3.NamedNode(type.datatype))
	} else if (type.type === "product") {
		for (const component of type.components) {
			const value = new N3.BlankNode(`t-${counter.value++}`)
			const object = yield* generateType(component.value, types, counter)
			yield new N3.Quad(value, ul[component.value.type], object)

			const componentSubject = new N3.BlankNode(`t-${counter.value++}`)
			yield new N3.Quad(componentSubject, rdfType, ul.component)
			yield new N3.Quad(componentSubject, ul.source, subject)
			yield new N3.Quad(
				componentSubject,
				ul.key,
				new N3.NamedNode(component.key)
			)
			yield new N3.Quad(componentSubject, ul.value, value)
		}
	} else if (type.type === "coproduct") {
		for (const option of type.options) {
			const optionSubject = new N3.BlankNode(`t-${counter.value++}`)

			yield new N3.Quad(optionSubject, rdfType, ul.option)
			yield new N3.Quad(optionSubject, ul.key, new N3.NamedNode(option.key))
			yield new N3.Quad(optionSubject, ul.source, subject)

			const value = new N3.BlankNode(`t-${counter.value++}`)
			const object = yield* generateType(option.value, types, counter)
			yield new N3.Quad(value, ul[option.value.type], object)
			yield new N3.Quad(optionSubject, ul.value, value)
		}
	} else {
		signalInvalidType(type)
	}
	return subject
}

function* generateSchema(
	schema: APG.Schema,
	types: Map<APG.Type, N3.BlankNode>,
	counter: { value: number }
): Generator<N3.Quad, void, undefined> {
	for (const [index, label] of schema.entries()) {
		const subject = new N3.BlankNode(`l-${index}`)
		yield new N3.Quad(subject, rdfType, ul.label)
		yield new N3.Quad(subject, ul.key, new N3.NamedNode(label.key))

		const value = new N3.BlankNode(`t-${counter.value++}`)
		const object = yield* generateType(label.value, types, counter)
		yield new N3.Quad(value, ul[label.value.type], object)
		yield new N3.Quad(subject, ul.value, value)
	}
}
