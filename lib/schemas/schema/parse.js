"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toSchema = toSchema;
exports.fromSchema = fromSchema;

var N3 = _interopRequireWildcard(require("n3.ts"));

var APG = _interopRequireWildcard(require("../../apg.js"));

var ns = _interopRequireWildcard(require("../../namespace.js"));

var _utils = require("../../utils.js");

var _index = _interopRequireWildcard(require("./index.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function toSchema(instance) {
  const labels = instance[ns.label];
  const sources = {
    components: rotateTree(instance[ns.component]),
    options: rotateTree(instance[ns.option])
  };
  const typeCache = {
    product: new Map(),
    coproduct: new Map()
  };
  const permutation = new Map(labels.map((label, i) => {
    const {
      value: key
    } = label.get(ns.key);
    return [i, key];
  }));
  const schema = Object.fromEntries(labels.map(label => {
    const {
      value: key
    } = label.get(ns.key);
    const target = label.get(ns.value);
    const type = toType(target, instance, typeCache, sources, permutation);
    return [key, type];
  }));
  Object.freeze(schema);
  return schema;
}

function toType(value, instance, typeCache, sources, permutation) {
  if (value.is(ns.reference)) {
    const {
      index
    } = value.value;
    return APG.reference(permutation.get(index));
  } else if (value.is(ns.uri)) {
    return APG.uri();
  } else if (value.is(ns.literal)) {
    const {
      value: datatype
    } = value.value;
    return APG.literal(datatype);
  } else if (value.is(ns.product)) {
    const {
      index
    } = value.value;
    return toProduct(index, instance, typeCache, sources, permutation);
  } else if (value.is(ns.coproduct)) {
    const {
      index
    } = value.value;
    return toCoproduct(index, instance, typeCache, sources, permutation);
  } else {
    throw new Error(`Invalid value variant key ${value.key}`);
  }
}

function toProduct(index, instance, typeCache, sources, permutation) {
  if (typeCache.product.has(index)) {
    return typeCache.product.get(index);
  }

  const components = sources.components.get(index);
  const product = APG.product(components === undefined ? {} : Object.fromEntries(components.map(component => {
    const {
      value: key
    } = component.get(ns.key);
    const value = toType(component.get(ns.value), instance, typeCache, sources, permutation);
    return [key, value];
  })));
  typeCache.product.set(index, product);
  return product;
}

function toCoproduct(index, instance, typeCache, sources, permutation) {
  if (typeCache.coproduct.has(index)) {
    return typeCache.coproduct.get(index);
  }

  const options = Object.fromEntries(sources.options.get(index).map(option => {
    const {
      value: key
    } = option.get(ns.key);
    const value = toType(option.get(ns.value), instance, typeCache, sources, permutation);
    return [key, value];
  }));
  const coproduct = APG.coproduct(options);
  typeCache.coproduct.set(index, coproduct);
  return coproduct;
}

function rotateTree(trees) {
  const result = new Map();

  for (const tree of trees) {
    const {
      index
    } = tree.get(ns.source);
    const trees = result.get(index);

    if (trees === undefined) {
      result.set(index, [tree]);
    } else {
      trees.push(tree);
    }
  }

  return result;
}

const labelKeys = (0, _utils.getKeys)(_index.label.components);
const componentKeys = (0, _utils.getKeys)(_index.component.components);
const optionKeys = (0, _utils.getKeys)(_index.option.components);
const valueKeys = (0, _utils.getKeys)(_index.value.options);

function fromSchema(schema) {
  const instance = (0, _utils.mapKeys)(_index.default, () => []);
  const cache = new Map();

  for (const key of (0, _utils.getKeys)(schema)) {
    const type = schema[key];
    const variant = new APG.Variant(valueKeys, ns[type.type], fromType(schema, instance, cache, type));
    instance[ns.label].push(new APG.Record(labelKeys, [new N3.NamedNode(key), variant]));
  }

  for (const key of (0, _utils.getKeys)(_index.default)) {
    Object.freeze(instance[key]);
  }

  Object.freeze(instance);
  return instance;
}

function fromType(schema, instance, cache, type) {
  if (type.type === "reference") {
    return new APG.Pointer((0, _utils.getKeyIndex)(schema, type.value));
  } else if (type.type === "uri") {
    return APG.unit();
  } else if (type.type === "literal") {
    return new N3.NamedNode(type.datatype);
  } else if (type.type === "product") {
    const pointer = cache.get(type);

    if (pointer !== undefined) {
      return new APG.Pointer(pointer);
    }

    const index = instance[ns.product].push(APG.unit()) - 1;
    cache.set(type, index);

    for (const [key, value] of (0, _utils.forEntries)(type.components)) {
      instance[ns.component].push(new APG.Record(componentKeys, [new N3.NamedNode(key), new APG.Pointer(index), new APG.Variant(valueKeys, ns[value.type], fromType(schema, instance, cache, value))]));
    }

    return new APG.Pointer(index);
  } else if (type.type === "coproduct") {
    const pointer = cache.get(type);

    if (pointer !== undefined) {
      return new APG.Pointer(pointer);
    }

    const index = instance[ns.coproduct].push(APG.unit()) - 1;
    cache.set(type, index);

    for (const [key, value] of (0, _utils.forEntries)(type.options)) {
      instance[ns.option].push(new APG.Record(optionKeys, [new N3.NamedNode(key), new APG.Pointer(index), new APG.Variant(valueKeys, ns[value.type], fromType(schema, instance, cache, value))]));
    }

    return new APG.Pointer(index);
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}