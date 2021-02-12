import { Buffer } from "buffer"
import varint from "varint"
import signedVarint from "signed-varint"
import { CBOR } from "cbor-redux"

import { xsd, rdf } from "@underlay/namespaces"

import {
	Schema,
	Instance,
	forValue,
	forEntries,
	signalInvalidType,
} from "@underlay/apg"

export function encode<S extends { [key in string]: Schema.Type }>(
	schema: Schema.Schema<S>,
	instance: Instance.Instance<S>
): Buffer {
	const namedNodes: Set<string> = new Set()
	for (const [{}, values] of forEntries(instance)) {
		for (const value of values) {
			for (const [leaf] of forValue(value)) {
				if (leaf.kind === "uri") {
					namedNodes.add(leaf.value)
				}
			}
		}
	}

	const namedNodeArray = Array.from(namedNodes).sort()
	const namedNodeIds = new Map(namedNodeArray.map((value, i) => [value, i]))

	const data: Uint8Array[] = [
		new Uint8Array(varint.encode(namedNodeArray.length)),
	]

	for (const value of namedNodeArray) {
		data.push(
			new Uint8Array(varint.encode(value.length)),
			new Uint8Array(new TextEncoder().encode(value))
		)
	}

	for (const [{}, values] of forEntries(instance)) {
		data.push(new Uint8Array(varint.encode(values.length)))
		for (const value of values) {
			for (const buffer of encodeValue(value, namedNodeIds)) {
				data.push(buffer)
			}
		}
	}

	return Buffer.concat(data)
}

const integerPattern = /^(?:\+|\-)?[0-9]+$/

export function* encodeValue(
	value: Instance.Value,
	namedNodeIds: Map<string, number>
): Generator<Uint8Array, void, undefined> {
	if (value.kind === "reference") {
		yield new Uint8Array(varint.encode(value.index))
	} else if (value.kind === "uri") {
		const id = namedNodeIds.get(value.value)
		if (id === undefined) {
			throw new Error(`Could not find id for named node ${value.value}`)
		}
		yield new Uint8Array(varint.encode(id))
	} else if (value.kind === "literal") {
		yield* encodeLiteral(value)
	} else if (value.kind === "product") {
		for (const field of value) {
			yield* encodeValue(field, namedNodeIds)
		}
	} else if (value.kind === "coproduct") {
		yield new Uint8Array(varint.encode(value.index))
		yield* encodeValue(value.value, namedNodeIds)
	} else {
		signalInvalidType(value)
	}
}

export function* encodeLiteral(
	value: Instance.Literal
): Generator<Uint8Array, void, undefined> {
	if (value.datatype.value === xsd.boolean) {
		if (value.value === "true") {
			yield new Uint8Array([1])
		} else if (value.value === "false") {
			yield new Uint8Array([0])
		} else {
			throw new Error(`Invalid xsd:boolean value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.integer) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			yield new Uint8Array(signedVarint.encode(i))
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.nonNegativeInteger) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			if (!isNaN(i) && 0 <= i) {
				yield new Uint8Array(varint.encode(i))
			} else {
				throw new Error(
					`xsd:nonNegativeInteger value out of range: ${value.value}`
				)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.double) {
		const f = Number(value.value)
		if (isNaN(f)) {
			throw new Error(`Invalid xsd:double value: ${value.value}`)
		}
		const buffer = new ArrayBuffer(8)
		const view = new DataView(buffer)
		view.setFloat64(0, f)
		yield new Uint8Array(buffer)
	} else if (value.datatype.value === xsd.float) {
		const f = Number(value.value)
		if (isNaN(f)) {
			throw new Error(`Invalid xsd:float value: ${value.value}`)
		}
		const buffer = new ArrayBuffer(4)
		const view = new DataView(buffer)
		view.setFloat32(0, f)
		yield new Uint8Array(buffer)
	} else if (value.datatype.value === xsd.long) {
		if (integerPattern.test(value.value)) {
			const i = BigInt(value.value)
			if (-9223372036854775808n <= i && i <= 9223372036854775807n) {
				const buffer = new ArrayBuffer(8)
				const view = new DataView(buffer)
				view.setBigInt64(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:long value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.int) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			if (!isNaN(i) && -2147483648 <= i && i <= 2147483647) {
				const buffer = new ArrayBuffer(4)
				const view = new DataView(buffer)
				view.setInt32(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:int value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.short) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			if (!isNaN(i) && -32768 <= i && i <= 32767) {
				const buffer = new ArrayBuffer(2)
				const view = new DataView(buffer)
				view.setInt16(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:int value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.byte) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			if (!isNaN(i) && -128 <= i && i <= 127) {
				const buffer = new ArrayBuffer(1)
				const view = new DataView(buffer)
				view.setInt8(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:int value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.unsignedLong) {
		if (integerPattern.test(value.value)) {
			const i = BigInt(value.value)
			if (0n <= i && i <= 18446744073709551615n) {
				const buffer = new ArrayBuffer(8)
				const view = new DataView(buffer)
				view.setBigUint64(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:unsignedLong value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.unsignedInt) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			if (!isNaN(i) && 0 <= i && i <= 4294967295) {
				const buffer = new ArrayBuffer(4)
				const view = new DataView(buffer)
				view.setUint32(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:unsignedInt value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.unsignedShort) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			if (!isNaN(i) && 0 <= i && i <= 65535) {
				const buffer = new ArrayBuffer(2)
				const view = new DataView(buffer)
				view.setUint16(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:unsignedSort value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.unsignedByte) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			if (!isNaN(i) && 0 <= i && i <= 255) {
				const buffer = new ArrayBuffer(1)
				const view = new DataView(buffer)
				view.setUint8(0, i)
				yield new Uint8Array(buffer)
			} else {
				throw new Error(`xsd:unsignedByte value out of range: ${i}`)
			}
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (value.datatype.value === xsd.hexBinary) {
		const data = Buffer.from(value.value, "hex")
		yield new Uint8Array(varint.encode(data.length))
		yield data
	} else if (value.datatype.value === xsd.base64Binary) {
		const data = Buffer.from(value.value, "base64")
		yield new Uint8Array(varint.encode(data.length))
		yield data
	} else if (value.datatype.value === rdf.JSON) {
		const data = Buffer.from(CBOR.encode(JSON.parse(value.value)))
		yield new Uint8Array(varint.encode(data.length))
		yield data
	} else {
		yield new Uint8Array(varint.encode(value.value.length))
		yield new TextEncoder().encode(value.value)
	}
}
