"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isRelationalSchema = isRelationalSchema;
exports.relationalSchema = void 0;

var t = _interopRequireWildcard(require("io-ts"));

var _namespace = require("../namespace.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const property = t.union([t.type({
  type: t.literal("reference"),
  value: t.number
}), t.type({
  type: t.literal("literal"),
  datatype: t.string
}), t.type({
  type: t.literal("iri")
})]);
const optionalProperty = t.union([property, t.type({
  type: t.literal("coproduct"),
  options: t.tuple([t.type({
    type: t.literal("option"),
    key: t.literal(_namespace.none),
    value: t.type({
      type: t.literal("unit")
    })
  }), t.type({
    type: t.literal("option"),
    key: t.literal(_namespace.some),
    value: property
  })])
})]);
const type = t.union([t.type({
  type: t.literal("unit")
}), t.type({
  type: t.literal("product"),
  components: t.array(t.type({
    type: t.literal("component"),
    key: t.string,
    value: optionalProperty
  }))
})]);
const label = t.type({
  type: t.literal("label"),
  key: t.string,
  value: type
});
const labels = t.array(label);

const isProperty = type => type.type === "reference" || type.type === "iri" || type.type === "literal";

function isOptionalProperty(type) {
  if (isProperty(type)) {
    return true;
  } else if (type.type === "coproduct" && type.options.length === 2) {
    const [first, second] = type.options;
    return first.key === _namespace.none && first.value.type === "unit" && second.key === _namespace.some && isProperty(second.value);
  } else {
    return false;
  }
}

function isRelationalSchema(input) {
  for (const label of input) {
    if (label.value.type === "unit") {
      continue;
    } else if (label.value.type === "product") {
      for (const component of label.value.components) {
        if (isOptionalProperty(component.value)) {
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
  return labels.is(input);
}, (input, context) => {
  if (isRelationalSchema(input)) {
    return t.success(input);
  } else {
    return t.failure(input, context);
  }
}, t.identity);
exports.relationalSchema = relationalSchema;