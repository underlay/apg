"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serializeString = serializeString;
exports.serialize = serialize;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _rdfCanonize = _interopRequireDefault(require("rdf-canonize"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function serializeString(instance, schema) {
  const quads = [];

  for (const quad of serialize(instance, schema)) {
    quads.push(quad.toJSON());
  }

  return _rdfCanonize.default.canonizeSync(quads, {
    algorithm: "URDNA2015"
  });
}

function* serialize(instance, schema) {
  const rdfType = new N3.NamedNode(N3.rdf.type);

  for (const [label, values] of (0, _utils.zip)(schema, instance)) {
    const className = new N3.NamedNode(label.key);

    for (const value of values) {
      const subject = getSubject(value, label.value, instance, schema);
      yield new N3.Quad(subject, rdfType, className);

      if (value.termType === "Record" || value.termType === "Variant") {
        yield* serializeValue(value, label.value, instance, schema);
      }
    }
  }
}

function* serializeValue(value, type, instance, schema) {
  if (value.termType === "Record" && type.type === "product") {
    for (const [nextValue, {
      key,
      value: nextType
    }] of (0, _utils.zip)(value, type.components)) {
      const object = nextValue.termType === "BlankNode" || nextValue.termType === "NamedNode" || nextValue.termType === "Literal" ? nextValue : nextValue.termType === "Pointer" ? getSubject(nextValue, nextType, instance, schema) : yield* serializeValue(nextValue, nextType, instance, schema);
      yield new N3.Quad(value.node, new N3.NamedNode(key), object);
    }

    return value.node;
  } else if (value.termType === "Variant" && type.type === "coproduct") {
    const predicate = new N3.NamedNode(value.optionKeys[value.index]);
    const nextValue = value.value;
    const nextType = type.options[value.index].value;
    const object = nextValue.termType === "BlankNode" || nextValue.termType === "NamedNode" || nextValue.termType === "Literal" ? nextValue : nextValue.termType === "Pointer" ? getSubject(nextValue, nextType, instance, schema) : yield* serializeValue(nextValue, nextType, instance, schema);
    yield new N3.Quad(value.node, predicate, object);
    return value.node;
  } else {
    throw new Error("Invalid value");
  }
}

function getSubject(value, type, instance, schema) {
  if (type.type === "reference" && value.termType === "Pointer") {
    const reference = instance[type.value][value.index];
    return getSubject(reference, schema[type.value].value, instance, schema);
  } else if (value.termType === "BlankNode") {
    return value;
  } else if (value.termType === "Record") {
    return value.node;
  } else if (value.termType === "Variant") {
    return value.node;
  } else {
    throw new Error("Invalid top-level value");
  }
}