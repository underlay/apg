"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mapping = exports.map = exports.match = exports.tuple = exports.injection = exports.projection = exports.dereference = exports.constant = exports.identifier = exports.isVariant = exports.Variant = exports.unit = exports.isRecord = exports.Record = exports.isLiteralValue = exports.isNamedNode = exports.isPointer = exports.Pointer = exports.instance = exports.isCoproduct = exports.coproduct = exports.isProduct = exports.product = exports.isLiteral = exports.literal = exports.isUri = exports.uri = exports.isReference = exports.reference = exports.schema = void 0;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _utils = require("./utils.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const schema = labels => Object.freeze(labels);

exports.schema = schema;

const reference = value => Object.freeze({
  type: "reference",
  value
});

exports.reference = reference;

const isReference = type => type.type === "reference";

exports.isReference = isReference;

const uri = () => Object.freeze({
  type: "uri"
});

exports.uri = uri;

const isUri = type => type.type === "uri";

exports.isUri = isUri;

const literal = datatype => Object.freeze({
  type: "literal",
  datatype
});

exports.literal = literal;

const isLiteral = type => type.type === "literal";

exports.isLiteral = isLiteral;

const product = components => Object.freeze({
  type: "product",
  components: Object.freeze(components)
});

exports.product = product;

const isProduct = type => type.type === "product";

exports.isProduct = isProduct;

const coproduct = options => Object.freeze({
  type: "coproduct",
  options: Object.freeze(options)
});

exports.coproduct = coproduct;

const isCoproduct = type => type.type === "coproduct";

exports.isCoproduct = isCoproduct;

const instance = (schema, instance) => {
  for (const [{}, values] of (0, _utils.forEntries)(instance)) {
    Object.freeze(values);
  }

  return Object.freeze(instance);
};

exports.instance = instance;

class Pointer {
  constructor(index) {
    this.index = index;
    Object.freeze(this);
  }

  get termType() {
    return "Pointer";
  }

}

exports.Pointer = Pointer;

const isPointer = value => value.termType === "Pointer";

exports.isPointer = isPointer;

const isNamedNode = value => value.termType === "NamedNode";

exports.isNamedNode = isNamedNode;

const isLiteralValue = value => value.termType === "Literal";

exports.isLiteralValue = isLiteralValue;

class Record extends Array {
  get termType() {
    return "Record";
  }

  constructor(components, values) {
    super(...values);
    this.components = components;
    Object.freeze(this);
  }

  get(key) {
    const index = this.components.indexOf(key);

    if (index in this) {
      return this[index];
    } else {
      throw new Error(`Index out of range: ${index}`);
    }
  }

  map(f) {
    const result = new Array(this.length);

    for (const [i, value] of this.entries()) {
      result[i] = f(value, i, this);
    }

    return result;
  }

}

exports.Record = Record;

const isRecord = value => value.termType === "Record";

exports.isRecord = isRecord;
const unitKeys = [];
const unitValues = [];

const unit = () => new Record(unitKeys, unitValues);

exports.unit = unit;

class Variant {
  constructor(options, key, value) {
    this.options = options;
    this.key = key;
    this.value = value;
    this.index = options.indexOf(key);

    if (this.index in options) {
      Object.freeze(this);
    } else {
      throw new Error("Varint index out of range");
    }
  }

  get termType() {
    return "Variant";
  }

  is(key) {
    return key === this.key;
  }

}

exports.Variant = Variant;

const isVariant = value => value.termType === "Variant";

exports.isVariant = isVariant;

const identifier = value => Object.freeze({
  type: "identifier",
  value
});

exports.identifier = identifier;

const constant = (value, datatype) => Object.freeze({
  type: "constant",
  value,
  datatype
});

exports.constant = constant;

const dereference = key => Object.freeze({
  type: "dereference",
  key
});

exports.dereference = dereference;

const projection = key => Object.freeze({
  type: "projection",
  key
});

exports.projection = projection;

const injection = key => Object.freeze({
  type: "injection",
  key
});

exports.injection = injection;

const tuple = slots => Object.freeze({
  type: "tuple",
  slots: Object.freeze(slots)
});

exports.tuple = tuple;

const match = cases => Object.freeze({
  type: "match",
  cases: Object.freeze(cases)
});

exports.match = match;

const map = (source, value) => Object.freeze({
  type: "map",
  source,
  value
});

exports.map = map;

const mapping = maps => Object.freeze(maps);

exports.mapping = mapping;