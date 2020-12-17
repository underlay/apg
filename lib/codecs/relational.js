"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isRelationalSchema = isRelationalSchema;
exports.relationalSchema = void 0;

var t = _interopRequireWildcard(require("io-ts"));

var _namespace = require("../namespace.js");

var _utils = require("../utils.js");

var _unit = require("./unit.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const property = t.union([t.type({
  type: t.literal("reference"),
  value: t.string
}), t.type({
  type: t.literal("literal"),
  datatype: t.string
}), t.type({
  type: t.literal("uri")
})]);
const optionalProperty = t.union([property, t.type({
  type: t.literal("coproduct"),
  options: t.type({
    [_namespace.none]: t.type({
      type: t.literal("product"),
      components: t.type({})
    }),
    [_namespace.some]: property
  })
})]);
const type = t.type({
  type: t.literal("product"),
  components: t.record(t.string, optionalProperty)
});
const labels = t.record(t.string, type);

const isProperty = type => type.type === "reference" || type.type === "uri" || type.type === "literal";

const isOptionalProperty = type => isProperty(type) || type.type === "coproduct" && (0, _utils.getKeys)(type).length === 2 && _namespace.none in type.options && (0, _unit.isUnit)(type.options[_namespace.none]) && _namespace.some in type.options && isProperty(type.options[_namespace.some]);

function isRelationalSchema(input) {
  for (const [{}, type] of (0, _utils.forEntries)(input)) {
    if (type.type === "product") {
      for (const [_, value] of (0, _utils.forEntries)(type.components)) {
        if (isOptionalProperty(value)) {
          continue;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }
  }

  return true;
}

const relationalSchema = new t.Type("Relational", input => {
  return labels.is(input) && isRelationalSchema(input);
}, (input, context) => {
  if (isRelationalSchema(input)) {
    return t.success(input);
  } else {
    return t.failure(input, context);
  }
}, t.identity);
exports.relationalSchema = relationalSchema;