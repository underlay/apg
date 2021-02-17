import { Schema, Instance } from "@underlay/apg"

import { rdf, xsd } from "@underlay/namespaces"

import { encode, log } from ".."

import signedVarint from "signed-varint"
import varint from "varint"

test("xsd:boolean test", () => {
	const s = Schema.schema({
		foo: Schema.literal(xsd.boolean),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal("true"),
			new Instance.Literal("true"),
			new Instance.Literal("false"),
		],
	})

	const bytes = encode(s, i)
	expect(bytes.equals(Buffer.from([1, 0, 3, 1, 1, 0]))).toBe(true)
	log(s, bytes)
})

test("xsd:integer test", () => {
	const s = Schema.schema({
		foo: Schema.literal(xsd.integer),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal("189783892"),
			new Instance.Literal("-3"),
			new Instance.Literal("-99"),
		],
	})

	const bytes = encode(s, i)
	expect(
		bytes.equals(
			Buffer.from([
				1,
				0,
				3,
				...signedVarint.encode(189783892),
				...signedVarint.encode(-3),
				...signedVarint.encode(-99),
			])
		)
	).toBe(true)
	log(s, bytes)
})

test("xsd:int test", () => {
	const s = Schema.schema({
		foo: Schema.literal(xsd.int),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal("7883892"),
			new Instance.Literal("1"),
			new Instance.Literal("-100"),
		],
	})

	const bytes = encode(s, i)

	const buffer = new ArrayBuffer(3 * 4)
	const view = new DataView(buffer)
	view.setInt32(0, 7883892)
	view.setInt32(4, 1)
	view.setInt32(8, -100)

	expect(
		bytes.equals(Buffer.concat([Buffer.from([1, 0, 3]), Buffer.from(buffer)]))
	).toBe(true)

	log(s, bytes)
})

test("xsd:short test", () => {
	const s = Schema.schema({
		foo: Schema.literal(xsd.short),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal("-1892"),
			new Instance.Literal("-1892"),
			new Instance.Literal("-1892"),
		],
	})

	const bytes = encode(s, i)

	log(s, bytes)
})

test("xsd:byte test", () => {
	const s = Schema.schema({
		foo: Schema.literal(xsd.byte),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal("-90"),
			new Instance.Literal("-90"),
			new Instance.Literal("-90"),
			new Instance.Literal("-90"),
		],
	})

	const bytes = encode(s, i)

	log(s, bytes)
})

test("xsd:unsignedLong test", () => {
	const s = Schema.schema({
		foo: Schema.literal(xsd.unsignedLong),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal("18446744073709551610"),
			new Instance.Literal("18446744073709551610"),
		],
	})

	const bytes = encode(s, i)

	log(s, bytes)
})

test("xsd:hexBinary test", () => {
	const s = Schema.schema({
		foo: Schema.literal(xsd.hexBinary),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal(`8290EFFAC840`),
			new Instance.Literal(`8290EFFAC840`),
			new Instance.Literal(`8290EFFAC840`),
		],
	})

	const bytes = encode(s, i)

	log(s, bytes)
})

test("rdf:JSON test", () => {
	const s = Schema.schema({
		foo: Schema.literal(rdf.JSON),
	})

	const i = Instance.instance(s, {
		foo: [
			new Instance.Literal(`{"foo": 4}`),
			new Instance.Literal(`{"foo": 4}`),
		],
	})

	const bytes = encode(s, i)
	log(s, bytes)
})
