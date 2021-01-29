import { Schema, Instance } from "@underlay/apg"

import { rdf, xsd } from "@underlay/namespaces"

import { encode, log } from ".."

test("xsd:boolean test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(xsd.boolean) }),
	})

	const datatype = Instance.uri(xsd.boolean)

	const i = Instance.instance(s, {
		foo: [Instance.product(["bar"], [Instance.literal("true", datatype)])],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

test("xsd:integer test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(xsd.integer) }),
	})

	const datatype = Instance.uri(xsd.integer)

	const i = Instance.instance(s, {
		foo: [Instance.product(["bar"], [Instance.literal("189783892", datatype)])],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

test("xsd:int test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(xsd.int) }),
	})

	const datatype = Instance.uri(xsd.int)

	const i = Instance.instance(s, {
		foo: [Instance.product(["bar"], [Instance.literal("7883892", datatype)])],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

test("xsd:short test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(xsd.short) }),
	})

	const datatype = Instance.uri(xsd.short)

	const i = Instance.instance(s, {
		foo: [Instance.product(["bar"], [Instance.literal("-1892", datatype)])],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

test("xsd:byte test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(xsd.byte) }),
	})

	const datatype = Instance.uri(xsd.byte)

	const i = Instance.instance(s, {
		foo: [Instance.product(["bar"], [Instance.literal("-90", datatype)])],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

test("xsd:unsignedLong test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(xsd.unsignedLong) }),
	})

	const datatype = Instance.uri(xsd.unsignedLong)

	const i = Instance.instance(s, {
		foo: [
			Instance.product(
				["bar"],
				[Instance.literal("18446744073709551610", datatype)]
			),
		],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

test("xsd:hexBinary test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(xsd.hexBinary) }),
	})

	const datatype = Instance.uri(xsd.hexBinary)

	const i = Instance.instance(s, {
		foo: [
			Instance.product(["bar"], [Instance.literal(`8290EFFAC840`, datatype)]),
		],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})

test("rdf:JSON test", () => {
	const s = Schema.schema({
		foo: Schema.product({ bar: Schema.literal(rdf.JSON) }),
	})

	const datatype = Instance.uri(rdf.JSON)

	const i = Instance.instance(s, {
		foo: [
			Instance.product(["bar"], [Instance.literal(`{"foo": 4}`, datatype)]),
		],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})
