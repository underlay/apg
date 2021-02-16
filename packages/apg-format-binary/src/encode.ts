import { Buffer } from "buffer"
import varint from "varint"
import signedVarint from "signed-varint"
import { CBOR } from "cbor-redux"

import { xsd, rdf } from "@underlay/namespaces"

import {
	Schema,
	Instance,
	signalInvalidType,
	getKeys,
	forTypes,
	forValues,
} from "@underlay/apg"

export function encode<S extends { [key in string]: Schema.Type }>(
	schema: Schema.Schema<S>,
	instance: Instance.Instance<S>
): Buffer {
	const namedNodes: Set<string> = new Set()
	for (const [type, key, path] of forTypes(schema)) {
		if (type.kind === "uri") {
			for (const value of forValues(schema, instance, key, path)) {
				if (value.kind === "uri") {
					namedNodes.add(value.value)
				}
			}
		}
	}

	const namedNodeArray = Array.from(namedNodes).sort()
	const namedNodeIds = new Map<string, number>()
	for (const [i, value] of namedNodeArray.entries()) {
		namedNodeIds.set(value, i)
		delete namedNodeArray[i]
	}

	const data: Uint8Array[] = [
		new Uint8Array(varint.encode(namedNodeArray.length)),
	]

	for (const value of namedNodeArray) {
		data.push(
			new Uint8Array(varint.encode(value.length)),
			new Uint8Array(new TextEncoder().encode(value))
		)
	}

	for (const key of getKeys(schema)) {
		if (key in instance) {
			const values = instance[key]
			data.push(new Uint8Array(varint.encode(values.length)))
			for (const value of values) {
				for (const buffer of encodeValue(schema[key], value, namedNodeIds)) {
					data.push(buffer)
				}
			}
		} else {
			throw new Error(`Key not found in instance: ${key}`)
		}
	}

	return Buffer.concat(data)
}

const integerPattern = /^(?:\+|\-)?[0-9]+$/

export function* encodeValue(
	type: Schema.Type,
	value: Instance.Value,
	namedNodeIds: Map<string, number>
): Generator<Uint8Array, void, undefined> {
	if (type.kind === "reference") {
		if (value.kind === "reference") {
			yield new Uint8Array(varint.encode(value.index))
		} else {
			throw new Error("Invalid value: expected reference")
		}
	} else if (type.kind === "uri") {
		if (value.kind === "uri") {
			const id = namedNodeIds.get(value.value)
			if (id === undefined) {
				throw new Error(`Could not find id for named node ${value.value}`)
			}
			yield new Uint8Array(varint.encode(id))
		} else {
			throw new Error("Invalid value: expected uri")
		}
	} else if (type.kind === "literal") {
		if (value.kind === "literal") {
			yield* encodeLiteral(type, value)
		} else {
			throw new Error("Invalid value: expected literal")
		}
	} else if (type.kind === "product") {
		if (value.kind == "product") {
			for (const [index, key] of getKeys(type.components).entries()) {
				if (index in value) {
					yield* encodeValue(type.components[key], value[index], namedNodeIds)
				}
			}
		} else {
			throw new Error("Invalid value: expected product")
		}
	} else if (type.kind === "coproduct") {
		if (value.kind === "coproduct") {
			const key = value.key(type)
			yield new Uint8Array(varint.encode(value.index))
			yield* encodeValue(type.options[key], value.value, namedNodeIds)
		} else {
			throw new Error("Invalid value: expected coproduct")
		}
	} else {
		signalInvalidType(type)
	}
}

export function* encodeLiteral(
	type: Schema.Literal,
	value: Instance.Literal
): Generator<Uint8Array, void, undefined> {
	if (type.datatype === xsd.boolean) {
		if (value.value === "true") {
			yield new Uint8Array([1])
		} else if (value.value === "false") {
			yield new Uint8Array([0])
		} else {
			throw new Error(`Invalid xsd:boolean value: ${value.value}`)
		}
	} else if (type.datatype === xsd.integer) {
		if (integerPattern.test(value.value)) {
			const i = Number(value.value)
			yield new Uint8Array(signedVarint.encode(i))
		} else {
			throw new Error(`Invalid integer value: ${value.value}`)
		}
	} else if (type.datatype === xsd.nonNegativeInteger) {
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
	} else if (type.datatype === xsd.double) {
		const f = Number(value.value)
		if (isNaN(f)) {
			throw new Error(`Invalid xsd:double value: ${value.value}`)
		}
		const buffer = new ArrayBuffer(8)
		const view = new DataView(buffer)
		view.setFloat64(0, f)
		yield new Uint8Array(buffer)
	} else if (type.datatype === xsd.float) {
		const f = Number(value.value)
		if (isNaN(f)) {
			throw new Error(`Invalid xsd:float value: ${value.value}`)
		}
		const buffer = new ArrayBuffer(4)
		const view = new DataView(buffer)
		view.setFloat32(0, f)
		yield new Uint8Array(buffer)
	} else if (type.datatype === xsd.long) {
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
	} else if (type.datatype === xsd.int) {
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
	} else if (type.datatype === xsd.short) {
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
	} else if (type.datatype === xsd.byte) {
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
	} else if (type.datatype === xsd.unsignedLong) {
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
	} else if (type.datatype === xsd.unsignedInt) {
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
	} else if (type.datatype === xsd.unsignedShort) {
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
	} else if (type.datatype === xsd.unsignedByte) {
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
	} else if (type.datatype === xsd.hexBinary) {
		const data = Buffer.from(value.value, "hex")
		yield new Uint8Array(varint.encode(data.length))
		yield data
	} else if (type.datatype === xsd.base64Binary) {
		const data = Buffer.from(value.value, "base64")
		yield new Uint8Array(varint.encode(data.length))
		yield data
	} else if (type.datatype === rdf.JSON) {
		const data = Buffer.from(CBOR.encode(JSON.parse(value.value)))
		yield new Uint8Array(varint.encode(data.length))
		yield data
	} else {
		yield new Uint8Array(varint.encode(value.value.length))
		yield new TextEncoder().encode(value.value)
	}
}
