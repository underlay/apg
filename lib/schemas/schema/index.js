"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.option = exports.coproduct = exports.component = exports.product = exports.label = exports.value = void 0;

var APG = _interopRequireWildcard(require("../../apg.js"));

var ns = _interopRequireWildcard(require("../../namespace.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const value = APG.coproduct({
  [ns.reference]: APG.reference(ns.label),
  [ns.uri]: APG.product({}),
  [ns.literal]: APG.uri(),
  [ns.product]: APG.reference(ns.product),
  [ns.coproduct]: APG.reference(ns.coproduct)
}); // Label

exports.value = value;
const label = APG.product({
  [ns.key]: APG.uri(),
  [ns.value]: value
}); // Product

exports.label = label;
const product = APG.product({}); // Component

exports.product = product;
const component = APG.product({
  [ns.key]: APG.uri(),
  [ns.source]: APG.reference(ns.product),
  [ns.value]: value
}); // Coproduct

exports.component = component;
const coproduct = APG.product({}); // Option

exports.coproduct = coproduct;
const option = APG.product({
  [ns.key]: APG.uri(),
  [ns.source]: APG.reference(ns.coproduct),
  [ns.value]: value
});
exports.option = option;
const schemaSchema = APG.schema({
  [ns.label]: label,
  [ns.product]: product,
  [ns.component]: component,
  [ns.coproduct]: coproduct,
  [ns.option]: option
});
var _default = schemaSchema;
exports.default = _default;