"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.type = exports.coproduct = exports.product = exports.literal = exports.uri = exports.reference = void 0;

var t = _interopRequireWildcard(require("io-ts"));

var _type = require("../type.js");

var _utils = require("../utils.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const reference = t.type({
  type: t.literal("reference"),
  value: t.string
});
exports.reference = reference;
const uri = t.type({
  type: t.literal("uri")
});
exports.uri = uri;
const literal = t.type({
  type: t.literal("literal"),
  datatype: t.string
});
exports.literal = literal;
const product = t.recursion("Product", () => t.type({
  type: t.literal("product"),
  components: t.record(t.string, type)
}));
exports.product = product;
const coproduct = t.recursion("Coproduct", () => t.type({
  type: t.literal("coproduct"),
  options: t.record(t.string, type)
}));
exports.coproduct = coproduct;
const type = t.recursion("Type", () => t.union([reference, uri, literal, product, coproduct]));
exports.type = type;
const labels = t.record(t.string, type);
const codec = new t.Type("Schema", labels.is, (input, context) => {
  const result = labels.validate(input, context);

  if (result._tag === "Left") {
    return result;
  } // Check that references have valid referents


  for (const [_, label] of (0, _utils.forEntries)(result.right)) {
    for (const [type] of (0, _type.forType)(label)) {
      if (type.type === "reference") {
        if (type.value in result.right) {
          continue;
        } else {
          return t.failure(type, context, "Invalid reference");
        }
      }
    }
  }

  return result;
}, t.identity);
var _default = codec;
exports.default = _default;