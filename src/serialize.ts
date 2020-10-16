import APG from "./apg.js"
import * as N3 from "n3.ts"
import { zip } from "./utils.js"

export function* serialize(
	instance: APG.Instance,
	schema: APG.Schema
): Generator<N3.Quad, void, undefined> {
	const rdfType = new N3.NamedNode(N3.rdf.type)
	for (const [label, values] of zip(schema, instance)) {
		const className = new N3.NamedNode(label.key)
		for (const value of values) {
			const subject = getSubject(value, label.value, instance, schema)
			yield new N3.Quad(subject, rdfType, className)
			if (value.termType === "Record" || value.termType === "Variant") {
				yield* serializeValue(value, label.value, instance, schema)
			}
		}
	}
}

function* serializeValue(
	value: APG.Record | APG.Variant,
	type: APG.Type,
	instance: APG.Instance,
	schema: APG.Schema
): Generator<N3.Quad, N3.BlankNode, undefined> {
	if (value.termType === "Record" && type.type === "product") {
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
			yield new N3.Quad(value.node, new N3.NamedNode(key), object)
		}
		return value.node
	} else if (value.termType === "Variant" && type.type === "coproduct") {
		const predicate = new N3.NamedNode(value.optionKeys[value.index])
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
		yield new N3.Quad(value.node, predicate, object)
		return value.node
	} else {
		throw new Error("Invalid value")
	}
}

function getSubject(
	value: APG.Value,
	type: APG.Type,
	instance: APG.Instance,
	schema: APG.Schema
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
