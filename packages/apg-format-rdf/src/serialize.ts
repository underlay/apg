import canonize from "rdf-canonize"
import RDF from "rdf-js"
import { DataFactory } from "n3"
import zip from "ziterable"

import { rdf } from "@underlay/namespaces"

import { Schema, Instance, forEntries } from "@underlay/apg"

export function serializeString(
	instance: Instance.Instance,
	schema: Schema.Schema
): string {
	const quads: RDF.Quad[] = []
	for (const quad of serialize(instance, schema)) {
		quads.push(quad.toJSON())
	}
	return canonize.canonizeSync(quads, { algorithm: "URDNA2015" })
}

export function* serialize(
	instance: Instance.Instance,
	schema: Schema.Schema
): Generator<RDF.Quad, void, undefined> {
	const rdfType = DataFactory.namedNode(rdf.type)
	for (const [key, type] of forEntries(schema)) {
		const values = instance[key]
		const className = DataFactory.namedNode(key)
		for (const value of values) {
			const subject = getSubject(value, type, instance, schema)
			yield DataFactory.quad(subject, rdfType, className)
			if (value.type === "product" || value.type === "coproduct") {
				yield* serializeValue(value, type, instance, schema)
			}
		}
	}
}

function* serializeValue(
	value: Instance.Product | Instance.Coproduct,
	type: Schema.Type,
	instance: Instance.Instance,
	schema: Schema.Schema
): Generator<RDF.Quad, RDF.BlankNode, undefined> {
	if (value.type === "product" && type.type === "product") {
		for (const [nextValue, { key, value: nextType }] of zip(
			value,
			type.components
		)) {
			const object =
				nextValue.termType === "BlankNode" ||
				nextValue.termType === "NamedNode" ||
				nextValue.termType === "Literal"
					? nextValue
					: nextValue.termType === "Pointer"
					? getSubject(nextValue, nextType, instance, schema)
					: yield* serializeValue(nextValue, nextType, instance, schema)
			yield DataFactory.quad(value.node, DataFactory.namedNode(key), object)
		}
		return value.node
	} else if (value.type === "coproduct" && type.type === "coproduct") {
		const predicate = DataFactory.namedNode(value.optionKeys[value.index])
		const nextValue = value.value
		const nextType = type.options[value.index].value
		const object =
			nextValue.termType === "BlankNode" ||
			nextValue.termType === "NamedNode" ||
			nextValue.termType === "Literal"
				? nextValue
				: nextValue.termType === "Pointer"
				? getSubject(nextValue, nextType, instance, schema)
				: yield* serializeValue(nextValue, nextType, instance, schema)
		yield DataFactory.quad(value.node, predicate, object)
		return value.node
	} else {
		throw new Error("Invalid value")
	}
}

function getSubject(
	value: Schema.Value,
	type: Schema.Type,
	instance: Schema.Instance,
	schema: Schema.Schema
): N3.BlankNode {
	if (type.type === "reference" && value.termType === "Pointer") {
		const reference = instance[type.value][value.index]
		return getSubject(reference, schema[type.value].value, instance, schema)
	} else if (value.termType === "BlankNode") {
		return value
	} else if (value.termType === "Record") {
		return value.node
	} else if (value.termType === "Variant") {
		return value.node
	} else {
		throw new Error("Invalid top-level value")
	}
}
