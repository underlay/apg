import canonize from "rdf-canonize"
import N3, { DataFactory } from "n3"
import RDF from "rdf-js"
import { rdf, ul as ul } from "@underlay/namespaces"

import { forEntries, Schema } from "@underlay/apg"

import { signalInvalidType } from "./utils.js"

const rdfType = DataFactory.namedNode(rdf.type)

const iris = {
	label: DataFactory.namedNode(ul.label),
	key: DataFactory.namedNode(ul.key),
	value: DataFactory.namedNode(ul.value),
	reference: DataFactory.namedNode(ul.reference),
	uri: DataFactory.namedNode(ul.uri),
	literal: DataFactory.namedNode(ul.literal),
	datatype: DataFactory.namedNode(ul.datatype),
	product: DataFactory.namedNode(ul.product),
	component: DataFactory.namedNode(ul.component),
	coproduct: DataFactory.namedNode(ul.coproduct),
	option: DataFactory.namedNode(ul.option),
	source: DataFactory.namedNode(ul.source),
}

export function serializeSchemaString(schema: Schema.Schema): string {
	const quads: RDF.Quad[] = []
	for (const quad of serializeSchema(schema)) {
		quads.push(quad.toJSON())
	}
	return canonize.canonizeSync(quads, { algorithm: "URDNA2015" })
}

export function* serializeSchema(
	schema: Schema.Schema
): Generator<RDF.Quad, void, undefined> {
	const typeIds: Map<Schema.Type, RDF.BlankNode> = new Map()
	const counter = { value: 0 }
	yield* generateSchema(schema, typeIds, counter)
}

function* generateSchema(
	schema: Schema.Schema,
	types: Map<Schema.Type, RDF.BlankNode>,
	counter: { value: number }
): Generator<RDF.Quad, void, undefined> {
	for (const [key, type, index] of forEntries(schema)) {
		const subject = DataFactory.blankNode(`l-${index}`)
		yield DataFactory.quad(subject, rdfType, iris.label)
		yield DataFactory.quad(subject, iris.key, DataFactory.namedNode(key))

		const value = DataFactory.blankNode(`t-${counter.value++}`)
		const object = yield* generateType(type, types, counter)
		yield DataFactory.quad(value, iris[type.type], object)
		yield DataFactory.quad(subject, iris.value, value)
	}
}

function* generateType(
	type: Schema.Type,
	types: Map<Schema.Type, N3.BlankNode>,
	counter: { value: number }
): Generator<RDF.Quad, RDF.BlankNode, undefined> {
	if (types.has(type)) {
		return types.get(type)!
	}

	const subject = DataFactory.blankNode(`t-${counter.value++}`)
	types.set(type, subject)

	yield DataFactory.quad(subject, rdfType, iris[type.type])

	if (type.type === "reference") {
		const object = DataFactory.blankNode(`l-${type.value}`)
		yield DataFactory.quad(subject, iris.value, object)
	} else if (type.type === "uri") {
	} else if (type.type === "literal") {
		yield DataFactory.quad(
			subject,
			iris.datatype,
			DataFactory.namedNode(type.datatype)
		)
	} else if (type.type === "product") {
		for (const [key, component] of forEntries(type.components)) {
			const value = DataFactory.blankNode(`t-${counter.value++}`)
			const object = yield* generateType(component, types, counter)
			yield DataFactory.quad(value, iris[component.type], object)

			const componentSubject = DataFactory.blankNode(`t-${counter.value++}`)
			yield DataFactory.quad(componentSubject, rdfType, iris.component)
			yield DataFactory.quad(componentSubject, iris.source, subject)
			yield DataFactory.quad(
				componentSubject,
				iris.key,
				DataFactory.namedNode(key)
			)
			yield DataFactory.quad(componentSubject, iris.value, value)
		}
	} else if (type.type === "coproduct") {
		for (const [key, option] of forEntries(type.options)) {
			const optionSubject = DataFactory.blankNode(`t-${counter.value++}`)

			yield DataFactory.quad(optionSubject, rdfType, iris.option)
			yield DataFactory.quad(
				optionSubject,
				iris.key,
				DataFactory.namedNode(key)
			)
			yield DataFactory.quad(optionSubject, iris.source, subject)

			const value = DataFactory.blankNode(`t-${counter.value++}`)
			const object = yield* generateType(option, types, counter)
			yield DataFactory.quad(value, iris[option.type], object)
			yield DataFactory.quad(optionSubject, iris.value, value)
		}
	} else {
		signalInvalidType(type)
	}
	return subject
}
