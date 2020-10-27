"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serializeSchemaString = serializeSchemaString;
exports.serializeSchema = serializeSchema;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _rdfCanonize = _interopRequireDefault(require("rdf-canonize"));

var ns = _interopRequireWildcard(require("./namespace.js"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const rdfType = new N3.NamedNode(N3.rdf.type);
const ul = {
  label: new N3.NamedNode(ns.label),
  key: new N3.NamedNode(ns.key),
  value: new N3.NamedNode(ns.value),
  reference: new N3.NamedNode(ns.reference),
  unit: new N3.NamedNode(ns.unit),
  iri: new N3.NamedNode(ns.iri),
  literal: new N3.NamedNode(ns.literal),
  datatype: new N3.NamedNode(ns.datatype),
  product: new N3.NamedNode(ns.product),
  component: new N3.NamedNode(ns.component),
  coproduct: new N3.NamedNode(ns.coproduct),
  option: new N3.NamedNode(ns.option),
  source: new N3.NamedNode(ns.source)
};

function serializeSchemaString(schema) {
  const quads = [];

  for (const quad of serializeSchema(schema)) {
    quads.push(quad.toJSON());
  }

  return _rdfCanonize.default.canonizeSync(quads, {
    algorithm: "URDNA2015"
  });
}

function* serializeSchema(schema) {
  const typeIds = new Map();
  const counter = {
    value: 0
  };
  yield* generateSchema(schema, typeIds, counter);
}

function* generateType(type, types, counter) {
  if (types.has(type)) {
    return types.get(type);
  }

  const subject = new N3.BlankNode(`t-${counter.value++}`);
  types.set(type, subject);
  yield new N3.Quad(subject, rdfType, ul[type.type]);

  if (type.type === "reference") {
    const object = new N3.BlankNode(`l-${type.value}`);
    yield new N3.Quad(subject, ul.value, object);
  } else if (type.type === "unit") {} else if (type.type === "iri") {} else if (type.type === "literal") {
    yield new N3.Quad(subject, ul.datatype, new N3.NamedNode(type.datatype));
  } else if (type.type === "product") {
    for (const component of type.components) {
      const value = new N3.BlankNode(`t-${counter.value++}`);
      const object = yield* generateType(component.value, types, counter);
      yield new N3.Quad(value, ul[component.value.type], object);
      const componentSubject = new N3.BlankNode(`t-${counter.value++}`);
      yield new N3.Quad(componentSubject, rdfType, ul.component);
      yield new N3.Quad(componentSubject, ul.source, subject);
      yield new N3.Quad(componentSubject, ul.key, new N3.NamedNode(component.key));
      yield new N3.Quad(componentSubject, ul.value, value);
    }
  } else if (type.type === "coproduct") {
    for (const option of type.options) {
      const optionSubject = new N3.BlankNode(`t-${counter.value++}`);
      yield new N3.Quad(optionSubject, rdfType, ul.option);
      yield new N3.Quad(optionSubject, ul.key, new N3.NamedNode(option.key));
      yield new N3.Quad(optionSubject, ul.source, subject);
      const value = new N3.BlankNode(`t-${counter.value++}`);
      const object = yield* generateType(option.value, types, counter);
      yield new N3.Quad(value, ul[option.value.type], object);
      yield new N3.Quad(optionSubject, ul.value, value);
    }
  } else {
    (0, _utils.signalInvalidType)(type);
  }

  return subject;
}

function* generateSchema(schema, types, counter) {
  for (const [index, label] of schema.entries()) {
    const subject = new N3.BlankNode(`l-${index}`);
    yield new N3.Quad(subject, rdfType, ul.label);
    yield new N3.Quad(subject, ul.key, new N3.NamedNode(label.key));
    const value = new N3.BlankNode(`t-${counter.value++}`);
    const object = yield* generateType(label.value, types, counter);
    yield new N3.Quad(value, ul[label.value.type], object);
    yield new N3.Quad(subject, ul.value, value);
  }
}