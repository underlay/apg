import varint from "varint";
import signedVarint from "signed-varint";
import { CBOR } from "cbor-redux";
import { rdf, xsd } from "@underlay/namespaces";
import { Instance, forEntries, forType, getKeys } from "@underlay/apg";
import { signalInvalidType } from "./utils.js";
export function decode(schema, data) {
    let offset = 0;
    const uriCount = varint.decode(data, offset);
    offset += varint.encodingLength(uriCount);
    const uris = new Array(uriCount);
    const decoder = new TextDecoder();
    for (let i = 0; i < uriCount; i++) {
        const length = varint.decode(data, offset);
        offset += varint.encodingLength(length);
        const value = decoder.decode(data.slice(offset, offset + length));
        offset += length;
        uris[i] = Instance.uri(value);
    }
    const datatypes = new Map();
    for (const [_, label] of forEntries(schema)) {
        for (const [type] of forType(label)) {
            if (type.kind === "literal") {
                if (datatypes.has(type.datatype)) {
                    continue;
                }
                else {
                    datatypes.set(type.datatype, Instance.uri(type.datatype));
                }
            }
        }
    }
    const instance = {};
    const state = { uris, data, offset };
    for (const [key, type] of forEntries(schema)) {
        const valuesLength = getVarint(state);
        const values = new Array(valuesLength);
        for (let i = 0; i < valuesLength; i++) {
            values[i] = decodeValue(state, type, datatypes);
        }
        Object.freeze(values);
        instance[key] = values;
    }
    return instance;
}
export function decodeValue(state, type, datatypes) {
    if (type.kind === "uri") {
        const index = getVarint(state);
        if (index >= state.uris.length) {
            throw new Error("Invalid named node index");
        }
        return state.uris[index];
    }
    else if (type.kind === "literal") {
        const datatype = datatypes.get(type.datatype);
        if (datatype === undefined) {
            throw new Error("Unexpected datatype");
        }
        else {
            const value = decodeLiteral(state, type.datatype);
            return Instance.literal(value, datatype);
        }
    }
    else if (type.kind === "product") {
        const values = [];
        for (const [{}, component] of forEntries(type.components)) {
            values.push(decodeValue(state, component, datatypes));
        }
        const keys = getKeys(type.components);
        return new Instance.Product(keys, values);
    }
    else if (type.kind === "coproduct") {
        const index = varint.decode(state.data, state.offset);
        state.offset += varint.encodingLength(index);
        const keys = getKeys(type.options);
        if (index in keys && keys[index] in type.options) {
            const option = type.options[keys[index]];
            const value = decodeValue(state, option, datatypes);
            return new Instance.Coproduct(keys, keys[index], value);
        }
        else {
            throw new Error("Invalid option index");
        }
    }
    else if (type.kind === "reference") {
        const index = getVarint(state);
        return new Instance.Reference(index);
    }
    else {
        signalInvalidType(type);
    }
}
function getView(state, length) {
    const view = new DataView(state.data.buffer, state.data.byteOffset + state.offset, length);
    state.offset += length;
    return view;
}
function getVarint(state) {
    const length = varint.decode(state.data, state.offset);
    state.offset += varint.encodingLength(length);
    return length;
}
export function decodeLiteral(state, datatype) {
    if (datatype === xsd.boolean) {
        const value = varint.decode(state.data, state.offset);
        state.offset += varint.encodingLength(value);
        if (value === 0) {
            return "false";
        }
        else if (value === 1) {
            return "true";
        }
        else {
            throw new Error(`Invalid boolean value ${value}`);
        }
    }
    else if (datatype === xsd.integer) {
        const i = signedVarint.decode(state.data, state.offset);
        state.offset += signedVarint.encodingLength(i);
        return i.toString();
    }
    else if (datatype === xsd.nonNegativeInteger) {
        const i = varint.decode(state.data, state.offset);
        state.offset += varint.encodingLength(i);
        return i.toString();
    }
    else if (datatype === xsd.double) {
        const view = getView(state, 8);
        const value = view.getFloat64(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:double value");
        }
        return value.toString();
    }
    else if (datatype === xsd.float) {
        const view = getView(state, 4);
        const value = view.getFloat32(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:float value");
        }
        return value.toString();
    }
    else if (datatype === xsd.long) {
        const view = getView(state, 8);
        const value = view.getBigInt64(0);
        return value.toString();
    }
    else if (datatype === xsd.int) {
        const view = getView(state, 4);
        const value = view.getInt32(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:int value");
        }
        return value.toString();
    }
    else if (datatype === xsd.short) {
        const view = getView(state, 2);
        const value = view.getInt16(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:short value");
        }
        return value.toString();
    }
    else if (datatype === xsd.byte) {
        const view = getView(state, 1);
        const value = view.getInt8(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:byte value");
        }
        return value.toString();
    }
    else if (datatype === xsd.unsignedLong) {
        const view = getView(state, 8);
        const value = view.getBigUint64(0);
        return value.toString();
    }
    else if (datatype === xsd.unsignedInt) {
        const view = getView(state, 4);
        const value = view.getUint32(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:unsignedInt value");
        }
        return value.toString();
    }
    else if (datatype === xsd.unsignedShort) {
        const view = getView(state, 2);
        const value = view.getUint16(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:unsignedShort value");
        }
        return value.toString();
    }
    else if (datatype === xsd.unsignedByte) {
        const view = getView(state, 1);
        const value = view.getUint8(0);
        if (isNaN(value)) {
            throw new Error("Invalid xsd:unsignedByte value");
        }
        return value.toString();
    }
    else if (datatype === xsd.hexBinary) {
        const length = getVarint(state);
        const buffer = state.data.slice(state.offset, state.offset + length);
        const value = buffer.toString("hex");
        state.offset += length;
        return value;
    }
    else if (datatype === xsd.base64Binary) {
        const length = getVarint(state);
        const buffer = state.data.slice(state.offset, state.offset + length);
        const value = buffer.toString("base64");
        state.offset += length;
        return value;
    }
    else if (datatype === rdf.JSON) {
        const length = getVarint(state);
        const { buffer } = new Uint8Array(state.data.slice(state.offset, state.offset + length));
        const value = CBOR.decode(buffer);
        state.offset += length;
        return JSON.stringify(value);
    }
    else {
        const length = getVarint(state);
        const value = new TextDecoder().decode(getView(state, length));
        return value;
    }
}
export function log(schema, data) {
    let offset = 0;
    const uriCount = varint.decode(data, offset);
    offset += varint.encodingLength(uriCount);
    process.stdout.write(`URI count: ${uriCount}\n`);
    const decoder = new TextDecoder();
    for (let i = 0; i < uriCount; i++) {
        const length = varint.decode(data, offset);
        offset += varint.encodingLength(length);
        const value = decoder.decode(data.slice(offset, offset + length));
        offset += length;
        process.stdout.write(`${i.toString().padStart(3)}: ${value}\n`);
    }
    process.stdout.write(`Header offset: ${offset}\n`);
    process.stdout.write(`Labels ----------------------\n`);
    const state = { data, offset };
    for (const [key, type, i] of forEntries(schema)) {
        const valuesLength = varint.decode(data, state.offset);
        state.offset += varint.encodingLength(valuesLength);
        process.stdout.write(`${i.toString().padStart(3)}: ${key}, ${valuesLength} elements --------\n`);
        for (let i = 0; i < valuesLength; i++) {
            process.stdout.write(`   ${i.toString().padStart(3)} ----------------------\n`);
            logValue("        ", state, type);
        }
    }
}
export function logValue(prefix, state, type) {
    if (type.kind === "uri") {
        const index = getVarint(state);
        process.stdout.write(`${prefix} uri index: ${index}\n`);
    }
    else if (type.kind === "literal") {
        const value = decodeLiteral(state, type.datatype);
        process.stdout.write(`${prefix} literal value: ${JSON.stringify(value)}\n`);
    }
    else if (type.kind === "product") {
        process.stdout.write(`${prefix} record with ${getKeys(type.components).length} components\n`);
        for (const [{}, component, i] of forEntries(type.components)) {
            logValue(`${prefix} | `, state, component);
        }
    }
    else if (type.kind === "coproduct") {
        const index = getVarint(state);
        const keys = getKeys(type.options);
        if (index in keys && keys[index] in type.options) {
            process.stdout.write(`${prefix} variant with key ${keys[index]}\n`);
            const option = type.options[keys[index]];
            logValue(`${prefix} > `, state, option);
        }
        else {
            throw new Error("Invalid option index");
        }
    }
    else if (type.kind === "reference") {
        const index = getVarint(state);
        process.stdout.write(`${prefix} reference to element ${index}\n`);
    }
    else {
        signalInvalidType(type);
    }
}
