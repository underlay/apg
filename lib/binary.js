import { Buffer } from "buffer";
import varint from "varint";
import signedVarint from "signed-varint";
import cbor from "cbor";
import * as N3 from "n3.ts";
import APG from "./apg.js";
import { forType, forValue, signalInvalidType, zip } from "./utils.js";
import { rdf, xsd } from "n3.ts";
export function encode(instance) {
    const namedNodes = new Set();
    for (const values of instance) {
        for (const value of values) {
            for (const [leaf] of forValue(value)) {
                if (leaf.termType === "NamedNode") {
                    namedNodes.add(leaf.value);
                }
            }
        }
    }
    const namedNodeArray = Array.from(namedNodes).sort();
    const namedNodeIds = new Map(namedNodeArray.map((value, i) => [value, i]));
    const data = [
        new Uint8Array(varint.encode(namedNodeArray.length)),
    ];
    namedNodeArray.reduce((previous, current) => {
        const prefix = findCommonPrefixIndex(previous, current);
        const suffix = current.slice(prefix);
        data.push(new Uint8Array(varint.encode(prefix)), new Uint8Array(varint.encode(suffix.length)), new Uint8Array(new TextEncoder().encode(suffix)));
        return current;
    }, "");
    for (const values of instance) {
        data.push(new Uint8Array(varint.encode(values.length)));
        for (const value of values) {
            for (const buffer of encodeValue(value, namedNodeIds)) {
                data.push(buffer);
            }
        }
    }
    return Buffer.concat(data);
}
const integerPattern = /^(?:\+|\-)?[0-9]+$/;
function* encodeValue(value, namedNodeIds) {
    if (value.termType === "Pointer") {
        yield new Uint8Array(varint.encode(value.index));
    }
    else if (value.termType === "BlankNode") {
        return;
    }
    else if (value.termType === "NamedNode") {
        const id = namedNodeIds.get(value.value);
        if (id === undefined) {
            throw new Error(`Could not find id for named node ${value.value}`);
        }
        yield new Uint8Array(varint.encode(id));
    }
    else if (value.termType === "Literal") {
        if (value.datatype.value === N3.xsd.boolean) {
            if (value.value === "true") {
                yield new Uint8Array([1]);
            }
            else if (value.value === "false") {
                yield new Uint8Array([0]);
            }
            else {
                throw new Error(`Invalid xsd:boolean value: ${value.value}`);
            }
        }
        else if (value.datatype.value === N3.xsd.integer) {
            if (integerPattern.test(value.value)) {
                const i = Number(value.value);
                yield new Uint8Array(signedVarint.encode(i));
            }
            else {
                throw new Error(`Invalid xsd:integer value: ${value.value}`);
            }
        }
        else if (value.datatype.value === N3.xsd.double) {
            const f = Number(value.value);
            if (isNaN(f)) {
                throw new Error(`Invalid xsd:double value: ${value.value}`);
            }
            const buffer = new ArrayBuffer(8);
            const view = new DataView(buffer);
            view.setFloat64(0, f);
            yield new Uint8Array(buffer);
        }
        else if (value.datatype.value === N3.xsd.hexBinary) {
            const data = Buffer.from(value.value, "hex");
            yield new Uint8Array(varint.encode(data.length));
            yield data;
        }
        else if (value.datatype.value === N3.xsd.base64Binary) {
            const data = Buffer.from(value.value, "base64");
            yield new Uint8Array(varint.encode(data.length));
            yield data;
        }
        else if (value.datatype.value === N3.rdf.JSON) {
            const data = cbor.encode(JSON.parse(value.value));
            yield new Uint8Array(varint.encode(data.length));
            yield data;
        }
        else {
            yield new Uint8Array(varint.encode(value.value.length));
            yield new TextEncoder().encode(value.value);
        }
    }
    else if (value.termType === "Record") {
        for (const field of value) {
            yield* encodeValue(field, namedNodeIds);
        }
    }
    else if (value.termType === "Variant") {
        yield new Uint8Array(varint.encode(value.index));
        yield* encodeValue(value.value, namedNodeIds);
    }
    else {
        throw new Error("Invalid value");
    }
}
export function decode(data, schema) {
    let offset = 0;
    const namedNodeArrayLength = varint.decode(data, offset);
    offset += varint.encodingLength(namedNodeArrayLength);
    const namedNodeArray = new Array(namedNodeArrayLength);
    const decoder = new TextDecoder();
    let previous = "";
    for (let i = 0; i < namedNodeArrayLength; i++) {
        const prefix = varint.decode(data, offset);
        offset += varint.encodingLength(prefix);
        const length = varint.decode(data, offset);
        offset += varint.encodingLength(length);
        const remainder = decoder.decode(data.slice(offset, offset + length));
        offset += length;
        const value = previous.slice(0, prefix) + remainder;
        namedNodeArray[i] = new N3.NamedNode(value);
        previous = value;
    }
    const componentKeys = new Map();
    const optionKeys = new Map();
    const datatypes = new Map();
    for (const label of schema) {
        for (const [type] of forType(label.value)) {
            if (type.type === "literal") {
                if (datatypes.has(type)) {
                    continue;
                }
                else {
                    datatypes.set(type, new N3.NamedNode(type.datatype));
                }
            }
            else if (type.type === "product") {
                if (componentKeys.has(type)) {
                    continue;
                }
                else {
                    const keys = type.components.map(({ key }) => key);
                    Object.freeze(keys);
                    componentKeys.set(type, keys);
                }
            }
            else if (type.type === "coproduct") {
                if (optionKeys.has(type)) {
                    continue;
                }
                else {
                    const keys = type.options.map(({ key }) => key);
                    Object.freeze(keys);
                    optionKeys.set(type, keys);
                }
            }
        }
    }
    for (const keys of componentKeys.values()) {
        Object.freeze(keys);
    }
    for (const keys of optionKeys.values()) {
        Object.freeze(keys);
    }
    const instance = new Array(schema.length);
    let id = 0;
    for (let i = 0; i < schema.length; i++) {
        const valuesLength = varint.decode(data, offset);
        offset += varint.encodingLength(valuesLength);
        const values = new Array(valuesLength);
        const { value: type } = schema[i];
        for (let j = 0; j < valuesLength; j++) {
            const [newId, newOffset, value] = decodeValue(id, offset, data, type, namedNodeArray, componentKeys, optionKeys);
            id = newId;
            offset = newOffset;
            values[j] = value;
        }
        Object.freeze(values);
        instance[i] = values;
    }
    Object.freeze(instance);
    return instance;
}
function decodeValue(id, offset, data, type, namedNodes, componentKeys, optionKeys) {
    if (type.type === "reference") {
        const index = varint.decode(data, offset);
        offset += varint.encodingLength(index);
        const value = new APG.Pointer(index);
        return [id, offset, value];
    }
    else if (type.type === "unit") {
        const value = new N3.BlankNode(`b${id++}`);
        return [id, offset, value];
    }
    else if (type.type === "iri") {
        const index = varint.decode(data, offset);
        offset += varint.encodingLength(index);
        if (index >= namedNodes.length) {
            throw new Error("Invalid named node index");
        }
        return [id, offset, namedNodes[index]];
    }
    else if (type.type === "literal") {
        const datatype = new N3.NamedNode(type.datatype);
        if (type.datatype === xsd.boolean) {
            const i = varint.decode(data, offset);
            offset += varint.encodingLength(i);
            if (i !== 0 && i !== 1) {
                throw new Error(`Invalid boolean value ${i}`);
            }
            const value = i === 0 ? "false" : "true";
            return [id, offset, new N3.Literal(value, "", datatype)];
        }
        else if (type.datatype === xsd.integer) {
            const i = signedVarint.decode(data, offset);
            offset += signedVarint.encodingLength(i);
            return [id, offset, new N3.Literal(i.toString(), "", datatype)];
        }
        else if (type.datatype === xsd.double) {
            const view = new DataView(data, offset, 8);
            const value = view.getFloat64(0);
            if (isNaN(value)) {
                throw new Error("Invalid double value");
            }
            return [id, offset + 8, new N3.Literal(value.toString(), "", datatype)];
        }
        else if (type.datatype === xsd.hexBinary) {
            const length = varint.decode(data, offset);
            offset += varint.encodingLength(length);
            const value = Buffer.from(data, offset, length).toString("hex");
            offset += length;
            return [id, offset, new N3.Literal(value, "", datatype)];
        }
        else if (type.datatype === xsd.base64Binary) {
            const length = varint.decode(data, offset);
            offset += varint.encodingLength(length);
            const value = Buffer.from(data, offset, length).toString("base64");
            offset += length;
            return [id, offset, new N3.Literal(value, "", datatype)];
        }
        else if (type.datatype === rdf.JSON) {
            const length = varint.decode(data, offset);
            offset += varint.encodingLength(length);
            const view = new DataView(data, offset, length);
            const value = JSON.stringify(cbor.decodeFirstSync(view));
            offset += length;
            return [id, offset, new N3.Literal(value, "", datatype)];
        }
        else {
            const length = varint.decode(data, offset);
            offset += varint.encodingLength(length);
            const view = new DataView(data, offset, length);
            const value = new TextDecoder().decode(view);
            offset += length;
            return [id, offset, new N3.Literal(value, "", datatype)];
        }
    }
    else if (type.type === "product") {
        const components = [];
        for (const component of type.components) {
            const [newId, newOffset, value] = decodeValue(id, offset, data, component.value, namedNodes, componentKeys, optionKeys);
            id = newId;
            offset = newOffset;
            components.push(value);
        }
        const node = new N3.BlankNode(`b${id++}`);
        const keys = componentKeys.get(type);
        if (keys === undefined) {
            throw new Error("No keys found for product");
        }
        return [id, offset, new APG.Record(node, keys, components)];
    }
    else if (type.type === "coproduct") {
        const index = varint.decode(data, offset);
        offset += varint.encodingLength(index);
        if (index >= type.options.length) {
            throw new Error("Invalid option index");
        }
        const option = type.options[index];
        const [newId, newOffset, value] = decodeValue(id, offset, data, option.value, namedNodes, componentKeys, optionKeys);
        id = newId;
        offset = newOffset;
        const node = new N3.BlankNode(`b${id++}`);
        const keys = optionKeys.get(type);
        if (keys === undefined) {
            throw new Error("No keys found for product");
        }
        return [id, offset, new APG.Variant(node, keys, index, value)];
    }
    else {
        signalInvalidType(type);
    }
}
function findCommonPrefixIndex(a, b) {
    for (const [A, B, i] of zip(a, b)) {
        if (A !== B) {
            return i;
        }
    }
    return Math.min(a.length, b.length);
}
//# sourceMappingURL=binary.js.map