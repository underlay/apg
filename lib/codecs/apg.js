"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.label = exports.option = exports.component = exports.type = exports.coproduct = exports.product = exports.literal = exports.iri = exports.unit = exports.reference = void 0;

var t = _interopRequireWildcard(require("io-ts"));

var _utils = require("../utils.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const reference = t.type({
  type: t.literal("reference"),
  value: t.number
});
exports.reference = reference;
const unit = t.type({
  type: t.literal("unit")
});
exports.unit = unit;
const iri = t.type({
  type: t.literal("iri")
});
exports.iri = iri;
const literal = t.type({
  type: t.literal("literal"),
  datatype: t.string
});
exports.literal = literal;
const product = t.recursion("Product", () => t.type({
  type: t.literal("product"),
  components: t.array(component)
}));
exports.product = product;
const coproduct = t.recursion("Coproduct", () => t.type({
  type: t.literal("coproduct"),
  options: t.array(option)
}));
exports.coproduct = coproduct;
const type = t.recursion("Type", () => t.union([reference, unit, iri, literal, product, coproduct]));
exports.type = type;
const component = t.type({
  type: t.literal("component"),
  key: t.string,
  value: type
});
exports.component = component;
const option = t.type({
  type: t.literal("option"),
  key: t.string,
  value: type
});
exports.option = option;
const label = t.type({
  type: t.literal("label"),
  key: t.string,
  value: type
});
exports.label = label;
const labels = t.array(label);
const codec = new t.Type("Schema", labels.is, (input, context) => {
  const result = labels.validate(input, context);

  if (result._tag === "Left") {
    return result;
  } // Check that the label keys are sorted
  // (this also checks for duplicates)


  if (isSorted(result.right) === false) {
    return t.failure(result.right, context, "Labels must be sorted by key");
  } // Check that all the components and options are sorted,
  // and that references have valid indices


  for (const label of result.right) {
    for (const [type] of (0, _utils.forType)(label.value)) {
      if (type.type === "reference") {
        if (result.right[type.value] === undefined) {
          return t.failure(type, context, "Invalid reference index");
        }
      } else if (type.type === "product") {
        if (isSorted(type.components) === false) {
          return t.failure(type, context, "Product components must be sorted by key");
        }
      } else if (type.type === "coproduct") {
        if (isSorted(type.options) === false) {
          return t.failure(type, context, "Coproduct options must be sorted by key");
        }
      }
    }
  }

  return result;
}, t.identity);

function isSorted(keys) {
  const result = keys.reduce((previous, {
    key
  }) => {
    if (previous === null) {
      return null;
    } else if (previous < key) {
      return key;
    } else {
      return null;
    }
  }, "");
  return result !== null;
}

var _default = codec;
exports.default = _default;