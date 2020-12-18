"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toSchema = toSchema;
exports.fromSchema = fromSchema;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _index = require("../../index.js");

var _index2 = _interopRequireWildcard(require("./index.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function toSchema(instance) {
  const labels = instance[_index.ns.label];
  const sources = {
    components: rotateTree(instance[_index.ns.component]),
    options: rotateTree(instance[_index.ns.option])
  };
  const typeCache = {
    product: new Map(),
    coproduct: new Map()
  };
  const permutation = new Map(labels.map((label, i) => {
    const {
      value: key
    } = label.get(_index.ns.key);
    return [i, key];
  }));
  const schema = Object.fromEntries(labels.map(label => {
    const {
      value: key
    } = label.get(_index.ns.key);
    const target = label.get(_index.ns.value);
    const type = toType(target, instance, typeCache, sources, permutation);
    return [key, type];
  }));
  Object.freeze(schema);
  return schema;
}

function toType(value, instance, typeCache, sources, permutation) {
  if (value.is(_index.ns.reference)) {
    const {
      index
    } = value.value;
    return _index.APG.reference(permutation.get(index));
  } else if (value.is(_index.ns.uri)) {
    return _index.APG.uri();
  } else if (value.is(_index.ns.literal)) {
    const {
      value: datatype
    } = value.value;
    return _index.APG.literal(datatype);
  } else if (value.is(_index.ns.product)) {
    const {
      index
    } = value.value;
    return toProduct(index, instance, typeCache, sources, permutation);
  } else if (value.is(_index.ns.coproduct)) {
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

  const product = _index.APG.product(components === undefined ? {} : Object.fromEntries(components.map(component => {
    const {
      value: key
    } = component.get(_index.ns.key);
    const value = toType(component.get(_index.ns.value), instance, typeCache, sources, permutation);
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
    } = option.get(_index.ns.key);
    const value = toType(option.get(_index.ns.value), instance, typeCache, sources, permutation);
    return [key, value];
  }));

  const coproduct = _index.APG.coproduct(options);

  typeCache.coproduct.set(index, coproduct);
  return coproduct;
}

function rotateTree(trees) {
  const result = new Map();

  for (const tree of trees) {
    const {
      index
    } = tree.get(_index.ns.source);
    const trees = result.get(index);

    if (trees === undefined) {
      result.set(index, [tree]);
    } else {
      trees.push(tree);
    }
  }

  return result;
}

const labelKeys = (0, _index.getKeys)(_index2.label.components);
const componentKeys = (0, _index.getKeys)(_index2.component.components);
const optionKeys = (0, _index.getKeys)(_index2.option.components);
const valueKeys = (0, _index.getKeys)(_index2.value.options);

function fromSchema(schema) {
  const instance = (0, _index.mapKeys)(_index2.default, () => []);
  const cache = new Map();

  for (const key of (0, _index.getKeys)(schema)) {
    const type = schema[key];
    const variant = new _index.APG.Variant(valueKeys, _index.ns[type.type], fromType(schema, instance, cache, type));

    instance[_index.ns.label].push(new _index.APG.Record(labelKeys, [new N3.NamedNode(key), variant]));
  }

  for (const key of (0, _index.getKeys)(_index2.default)) {
    Object.freeze(instance[key]);
  }

  Object.freeze(instance);
  return instance;
}

function fromType(schema, instance, cache, type) {
  if (type.type === "reference") {
    return new _index.APG.Pointer((0, _index.getKeyIndex)(schema, type.value));
  } else if (type.type === "uri") {
    return _index.APG.unit();
  } else if (type.type === "literal") {
    return new N3.NamedNode(type.datatype);
  } else if (type.type === "product") {
    const pointer = cache.get(type);

    if (pointer !== undefined) {
      return new _index.APG.Pointer(pointer);
    }

    const index = instance[_index.ns.product].push(_index.APG.unit()) - 1;
    cache.set(type, index);

    for (const [key, value] of (0, _index.forEntries)(type.components)) {
      instance[_index.ns.component].push(new _index.APG.Record(componentKeys, [new N3.NamedNode(key), new _index.APG.Pointer(index), new _index.APG.Variant(valueKeys, _index.ns[value.type], fromType(schema, instance, cache, value))]));
    }

    return new _index.APG.Pointer(index);
  } else if (type.type === "coproduct") {
    const pointer = cache.get(type);

    if (pointer !== undefined) {
      return new _index.APG.Pointer(pointer);
    }

    const index = instance[_index.ns.coproduct].push(_index.APG.unit()) - 1;
    cache.set(type, index);

    for (const [key, value] of (0, _index.forEntries)(type.options)) {
      instance[_index.ns.option].push(new _index.APG.Record(optionKeys, [new N3.NamedNode(key), new _index.APG.Pointer(index), new _index.APG.Variant(valueKeys, _index.ns[value.type], fromType(schema, instance, cache, value))]));
    }

    return new _index.APG.Pointer(index);
  } else {
    (0, _index.signalInvalidType)(type);
  }
}