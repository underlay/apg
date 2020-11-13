"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toSchema = toSchema;
exports.fromSchema = fromSchema;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _apg = _interopRequireDefault(require("./apg.js"));

var _bootstrap = _interopRequireDefault(require("./bootstrap.js"));

var ns = _interopRequireWildcard(require("./namespace.js"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function toSchema(instance) {
  if (instance.length !== _bootstrap.default.length) {
    throw new Error("Invalid schema schema instance");
  }

  const database = new Map(_bootstrap.default.map((label, index) => [label.key, instance[index]]));
  const labels = database.get(ns.label);
  const components = database.get(ns.component);
  const options = database.get(ns.option);
  const componentSources = rotateTree(components, ns.source);
  const optionSources = rotateTree(options, ns.source);
  const typeCache = new Map(_bootstrap.default.map(({
    key
  }) => [key, new Map()]));
  const sortedLabels = labels.slice().sort((a, b) => {
    const {
      value: A
    } = a.get(ns.key);
    const {
      value: B
    } = b.get(ns.key);
    return A < B ? -1 : B < A ? 1 : 0;
  });
  const permutation = labels.map(label => sortedLabels.indexOf(label));
  const schema = sortedLabels.map(label => {
    const {
      value: key
    } = label.get(ns.key);
    const target = label.get(ns.value);
    const value = toValue(target, database, typeCache, componentSources, optionSources, permutation);
    return Object.freeze({
      type: "label",
      key,
      value
    });
  });
  Object.freeze(schema);
  return schema;
}

function toValue(value, database, typeCache, componentSources, optionSources, permutation) {
  const {
    index
  } = value.value; // const { index } = record.get(ns.value) as APG.Pointer

  const key = value.key;
  const cache = typeCache.get(key);

  if (cache.has(index)) {
    return cache.get(index);
  } else if (key === ns.reference) {
    const reference = database.get(ns.reference)[index];
    return toReference(index, reference, typeCache, permutation);
  } else if (key === ns.unit) {
    return toUnit(index, typeCache);
  } else if (key === ns.iri) {
    return toIri(index, typeCache);
  } else if (key === ns.literal) {
    const literal = database.get(ns.literal)[index];
    return toLiteral(index, literal, typeCache);
  } else if (key === ns.product) {
    return toProduct(index, database, typeCache, componentSources, optionSources, permutation);
  } else if (key === ns.coproduct) {
    return toCoproduct(index, database, typeCache, componentSources, optionSources, permutation);
  } else {
    throw new Error(`Invalid value variant key ${key}`);
  }
}

function toReference(index, value, typeCache, permutation) {
  const target = value.get(ns.value);
  const reference = Object.freeze({
    type: "reference",
    value: permutation[target.index]
  });
  typeCache.get(ns.reference).set(index, reference);
  return reference;
}

function toUnit(index, typeCache) {
  const unit = Object.freeze({
    type: "unit"
  });
  typeCache.get(ns.unit).set(index, unit);
  return unit;
}

function toIri(index, typeCache) {
  const iri = Object.freeze({
    type: "iri"
  });
  typeCache.get(ns.iri).set(index, iri);
  return iri;
}

function toLiteral(index, value, typeCache) {
  const {
    value: datatype
  } = value.get(ns.datatype);
  const literal = Object.freeze({
    type: "literal",
    datatype
  });
  typeCache.get(ns.literal).set(index, literal);
  return literal;
}

function toProduct(index, database, typeCache, componentSources, optionSources, permutation) {
  const components = [];

  for (const component of componentSources.get(index) || []) {
    const {
      value: key
    } = component.get(ns.key);
    const value = toValue(component.get(ns.value), database, typeCache, componentSources, optionSources, permutation);
    components.push({
      type: "component",
      key,
      value
    });
  }

  Object.freeze(components.sort(({
    key: a
  }, {
    key: b
  }) => a < b ? -1 : b < a ? 1 : 0));
  const product = Object.freeze({
    type: "product",
    components
  });
  typeCache.get(ns.product).set(index, product);
  return product;
}

function toCoproduct(index, database, typeCache, componentSources, optionSources, permutation) {
  const options = [];

  for (const option of optionSources.get(index) || []) {
    const {
      value: key
    } = option.get(ns.key);
    const value = toValue(option.get(ns.value), database, typeCache, componentSources, optionSources, permutation);
    options.push({
      type: "option",
      key,
      value
    });
  }

  Object.freeze(options.sort(({
    key: a
  }, {
    key: b
  }) => a < b ? -1 : b < a ? 1 : 0));
  const coproduct = Object.freeze({
    type: "coproduct",
    options
  });
  typeCache.get(ns.coproduct).set(index, coproduct);
  return coproduct;
}

function rotateTree(trees, pivot) {
  const result = new Map();

  for (const tree of trees) {
    const value = tree.get(pivot);

    if (value === undefined || value.termType !== "Pointer") {
      throw new Error("Rotation failed because the value was not a pointer");
    }

    const trees = result.get(value.index);

    if (trees === undefined) {
      result.set(value.index, [tree]);
    } else {
      trees.push(tree);
    }
  }

  return result;
}

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
const schemaIndices = new Map(_bootstrap.default.map(({
  key
}, i) => [key, i]));
const labelIndex = schemaIndices.get(ns.label);
const unitIndex = schemaIndices.get(ns.unit);
const referenceIndex = schemaIndices.get(ns.reference);
const iriIndex = schemaIndices.get(ns.iri);
const literalIndex = schemaIndices.get(ns.literal);
const productIndex = schemaIndices.get(ns.product);
const coproductIndex = schemaIndices.get(ns.coproduct);
const valueKeys = Object.freeze([ns.coproduct, ns.iri, ns.literal, ns.product, ns.reference, ns.unit]);
const labelKeys = Object.freeze([ns.key, ns.value]);
const referenceKeys = Object.freeze([ns.value]);
const literalKeys = Object.freeze([ns.datatype]);
const productKeys = Object.freeze([ns.key, ns.source, ns.value]);
const coproductKeys = Object.freeze([ns.key, ns.source, ns.value]);

function fromSchema(schema) {
  let id = 0;
  const database = new Map(_bootstrap.default.map(({
    key
  }) => [key, []]));
  const cache = new Map();
  const labels = database.get(ns.label);

  for (const label of schema) {
    const [value, delta] = fromType(database, cache, label.value, id);
    id += delta;
    const key = valueKeys.indexOf(ul[label.value.type].value);
    const variant = new _apg.default.Variant(new N3.BlankNode(`b${id++}`), valueKeys, key, value);
    labels.push(new _apg.default.Record(new N3.BlankNode(`b${id++}`), labelKeys, [new N3.NamedNode(label.key), variant]));
  }

  const instance = _bootstrap.default.map(({
    key
  }) => {
    const values = database.get(key);
    Object.freeze(values);
    return values;
  });

  Object.freeze(instance);
  return instance;
}

function fromType(database, cache, type, id) {
  const pointer = cache.get(type);

  if (pointer !== undefined) {
    const [index, label] = pointer;
    return [new _apg.default.Pointer(index, label), id];
  } else if (type.type === "reference") {
    const reference = new _apg.default.Record(new N3.BlankNode(`b${id++}`), referenceKeys, [new _apg.default.Pointer(type.value, labelIndex)]);
    const index = database.get(ns.reference).push(reference) - 1;
    cache.set(type, [index, referenceIndex]);
    return [new _apg.default.Pointer(index, referenceIndex), id];
  } else if (type.type === "unit") {
    const unit = new N3.BlankNode(`b${id++}`);
    const index = database.get(ns.unit).push(unit) - 1;
    cache.set(type, [index, unitIndex]);
    return [new _apg.default.Pointer(index, unitIndex), id];
  } else if (type.type === "iri") {
    const iri = new N3.BlankNode(`b${id++}`);
    const index = database.get(ns.iri).push(iri) - 1;
    cache.set(type, [index, iriIndex]);
    return [new _apg.default.Pointer(index, iriIndex), id];
  } else if (type.type === "literal") {
    const literal = new _apg.default.Record(new N3.BlankNode(`b${id++}`), literalKeys, [new N3.NamedNode(type.datatype)]);
    const index = database.get(ns.literal).push(literal) - 1;
    cache.set(type, [index, literalIndex]);
    return [new _apg.default.Pointer(index, literalIndex), id];
  } else if (type.type === "product") {
    const product = new N3.BlankNode(`b${id++}`);
    const index = database.get(ns.product).push(product) - 1;
    cache.set(type, [index, productIndex]);
    const components = database.get(ns.component);

    for (const component of type.components) {
      const key = valueKeys.indexOf(ul[component.value.type].value);
      const [value, delta] = fromType(database, cache, component.value, id);
      id += delta;
      components.push(new _apg.default.Record(new N3.BlankNode(`b${id++}`), productKeys, [new N3.NamedNode(component.key), new _apg.default.Pointer(index, productIndex), new _apg.default.Variant(new N3.BlankNode(`b${id++}`), valueKeys, key, value)]));
    }

    return [new _apg.default.Pointer(index, productIndex), id];
  } else if (type.type === "coproduct") {
    const coproduct = new N3.BlankNode(`b${id++}`);
    const index = database.get(ns.coproduct).push(coproduct) - 1;
    cache.set(type, [index, coproductIndex]);
    const options = database.get(ns.option);

    for (const option of type.options) {
      const key = valueKeys.indexOf(ul[option.value.type].value);
      const [value, delta] = fromType(database, cache, option.value, id);
      id += delta;
      options.push(new _apg.default.Record(new N3.BlankNode(`b${id++}`), coproductKeys, [new N3.NamedNode(option.key), new _apg.default.Pointer(index, coproductIndex), new _apg.default.Variant(new N3.BlankNode(`b${id++}`), valueKeys, key, value)]));
    }

    return [new _apg.default.Pointer(index, coproductIndex), id];
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}