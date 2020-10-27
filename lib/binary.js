"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encode = encode;
exports.decode = decode;

var _buffer = require("buffer");

var _varint = _interopRequireDefault(require("varint"));

var _signedVarint = _interopRequireDefault(require("signed-varint"));

var _cbor = _interopRequireDefault(require("cbor"));

var N3 = _interopRequireWildcard(require("n3.ts"));

var _apg = _interopRequireDefault(require("./apg.js"));

var _utils = require("./utils.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function encode(instance) {
  const namedNodes = new Set();

  for (const values of instance) {
    for (const value of values) {
      for (const [leaf] of (0, _utils.forValue)(value)) {
        if (leaf.termType === "NamedNode") {
          namedNodes.add(leaf.value);
        }
      }
    }
  }

  const namedNodeArray = Array.from(namedNodes).sort();
  const namedNodeIds = new Map(namedNodeArray.map((value, i) => [value, i]));
  const data = [new Uint8Array(_varint.default.encode(namedNodeArray.length))];
  namedNodeArray.reduce((previous, current) => {
    const prefix = findCommonPrefixIndex(previous, current);
    const suffix = current.slice(prefix);
    data.push(new Uint8Array(_varint.default.encode(prefix)), new Uint8Array(_varint.default.encode(suffix.length)), new Uint8Array(new TextEncoder().encode(suffix)));
    return current;
  }, "");

  for (const values of instance) {
    data.push(new Uint8Array(_varint.default.encode(values.length)));

    for (const value of values) {
      for (const buffer of encodeValue(value, namedNodeIds)) {
        data.push(buffer);
      }
    }
  }

  return _buffer.Buffer.concat(data);
}

const integerPattern = /^(?:\+|\-)?[0-9]+$/;

function* encodeValue(value, namedNodeIds) {
  if (value.termType === "Pointer") {
    yield new Uint8Array(_varint.default.encode(value.index));
  } else if (value.termType === "BlankNode") {
    return;
  } else if (value.termType === "NamedNode") {
    const id = namedNodeIds.get(value.value);

    if (id === undefined) {
      throw new Error(`Could not find id for named node ${value.value}`);
    }

    yield new Uint8Array(_varint.default.encode(id));
  } else if (value.termType === "Literal") {
    if (value.datatype.value === N3.xsd.boolean) {
      if (value.value === "true") {
        yield new Uint8Array([1]);
      } else if (value.value === "false") {
        yield new Uint8Array([0]);
      } else {
        throw new Error(`Invalid xsd:boolean value: ${value.value}`);
      }
    } else if (value.datatype.value === N3.xsd.integer) {
      if (integerPattern.test(value.value)) {
        const i = Number(value.value);
        yield new Uint8Array(_signedVarint.default.encode(i));
      } else {
        throw new Error(`Invalid xsd:integer value: ${value.value}`);
      }
    } else if (value.datatype.value === N3.xsd.double) {
      const f = Number(value.value);

      if (isNaN(f)) {
        throw new Error(`Invalid xsd:double value: ${value.value}`);
      }

      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, f);
      yield new Uint8Array(buffer);
    } else if (value.datatype.value === N3.xsd.hexBinary) {
      const data = _buffer.Buffer.from(value.value, "hex");

      yield new Uint8Array(_varint.default.encode(data.length));
      yield data;
    } else if (value.datatype.value === N3.xsd.base64Binary) {
      const data = _buffer.Buffer.from(value.value, "base64");

      yield new Uint8Array(_varint.default.encode(data.length));
      yield data;
    } else if (value.datatype.value === N3.rdf.JSON) {
      const data = _cbor.default.encode(JSON.parse(value.value));

      yield new Uint8Array(_varint.default.encode(data.length));
      yield data;
    } else {
      yield new Uint8Array(_varint.default.encode(value.value.length));
      yield new TextEncoder().encode(value.value);
    }
  } else if (value.termType === "Record") {
    for (const field of value) {
      yield* encodeValue(field, namedNodeIds);
    }
  } else if (value.termType === "Variant") {
    yield new Uint8Array(_varint.default.encode(value.index));
    yield* encodeValue(value.value, namedNodeIds);
  } else {
    throw new Error("Invalid value");
  }
}

function decode(data, schema) {
  let offset = 0;

  const namedNodeArrayLength = _varint.default.decode(data, offset);

  offset += _varint.default.encodingLength(namedNodeArrayLength);
  const namedNodeArray = new Array(namedNodeArrayLength);
  const decoder = new TextDecoder();
  let previous = "";

  for (let i = 0; i < namedNodeArrayLength; i++) {
    const prefix = _varint.default.decode(data, offset);

    offset += _varint.default.encodingLength(prefix);

    const length = _varint.default.decode(data, offset);

    offset += _varint.default.encodingLength(length);
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
    for (const [type] of (0, _utils.forType)(label.value)) {
      if (type.type === "literal") {
        if (datatypes.has(type)) {
          continue;
        } else {
          datatypes.set(type, new N3.NamedNode(type.datatype));
        }
      } else if (type.type === "product") {
        if (componentKeys.has(type)) {
          continue;
        } else {
          const keys = type.components.map(({
            key
          }) => key);
          Object.freeze(keys);
          componentKeys.set(type, keys);
        }
      } else if (type.type === "coproduct") {
        if (optionKeys.has(type)) {
          continue;
        } else {
          const keys = type.options.map(({
            key
          }) => key);
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
    const valuesLength = _varint.default.decode(data, offset);

    offset += _varint.default.encodingLength(valuesLength);
    const values = new Array(valuesLength);
    const {
      value: type
    } = schema[i];

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
    const index = _varint.default.decode(data, offset);

    offset += _varint.default.encodingLength(index);
    const value = new _apg.default.Pointer(index);
    return [id, offset, value];
  } else if (type.type === "unit") {
    const value = new N3.BlankNode(`b${id++}`);
    return [id, offset, value];
  } else if (type.type === "iri") {
    const index = _varint.default.decode(data, offset);

    offset += _varint.default.encodingLength(index);

    if (index >= namedNodes.length) {
      throw new Error("Invalid named node index");
    }

    return [id, offset, namedNodes[index]];
  } else if (type.type === "literal") {
    const datatype = new N3.NamedNode(type.datatype);

    if (type.datatype === N3.xsd.boolean) {
      const i = _varint.default.decode(data, offset);

      offset += _varint.default.encodingLength(i);

      if (i !== 0 && i !== 1) {
        throw new Error(`Invalid boolean value ${i}`);
      }

      const value = i === 0 ? "false" : "true";
      return [id, offset, new N3.Literal(value, "", datatype)];
    } else if (type.datatype === N3.xsd.integer) {
      const i = _signedVarint.default.decode(data, offset);

      offset += _signedVarint.default.encodingLength(i);
      return [id, offset, new N3.Literal(i.toString(), "", datatype)];
    } else if (type.datatype === N3.xsd.double) {
      const view = new DataView(data, offset, 8);
      const value = view.getFloat64(0);

      if (isNaN(value)) {
        throw new Error("Invalid double value");
      }

      return [id, offset + 8, new N3.Literal(value.toString(), "", datatype)];
    } else if (type.datatype === N3.xsd.hexBinary) {
      const length = _varint.default.decode(data, offset);

      offset += _varint.default.encodingLength(length);

      const value = _buffer.Buffer.from(data, offset, length).toString("hex");

      offset += length;
      return [id, offset, new N3.Literal(value, "", datatype)];
    } else if (type.datatype === N3.xsd.base64Binary) {
      const length = _varint.default.decode(data, offset);

      offset += _varint.default.encodingLength(length);

      const value = _buffer.Buffer.from(data, offset, length).toString("base64");

      offset += length;
      return [id, offset, new N3.Literal(value, "", datatype)];
    } else if (type.datatype === N3.rdf.JSON) {
      const length = _varint.default.decode(data, offset);

      offset += _varint.default.encodingLength(length);
      const view = new DataView(data, offset, length);
      const value = JSON.stringify(_cbor.default.decodeFirstSync(view));
      offset += length;
      return [id, offset, new N3.Literal(value, "", datatype)];
    } else {
      const length = _varint.default.decode(data, offset);

      offset += _varint.default.encodingLength(length);
      const view = new DataView(data, offset, length);
      const value = new TextDecoder().decode(view);
      offset += length;
      return [id, offset, new N3.Literal(value, "", datatype)];
    }
  } else if (type.type === "product") {
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

    return [id, offset, new _apg.default.Record(node, keys, components)];
  } else if (type.type === "coproduct") {
    const index = _varint.default.decode(data, offset);

    offset += _varint.default.encodingLength(index);

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

    return [id, offset, new _apg.default.Variant(node, keys, index, value)];
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

function findCommonPrefixIndex(a, b) {
  for (const [A, B, i] of (0, _utils.zip)(a, b)) {
    if (A !== B) {
      return i;
    }
  }

  return Math.min(a.length, b.length);
}