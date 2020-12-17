"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.option = exports.coproduct = exports.component = exports.product = exports.label = exports.value = void 0;

var _apg = _interopRequireDefault(require("../../apg.js"));

var ns = _interopRequireWildcard(require("../../namespace.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const value = _apg.default.coproduct({
  [ns.reference]: _apg.default.reference(ns.label),
  [ns.uri]: _apg.default.product({}),
  [ns.literal]: _apg.default.uri(),
  [ns.product]: _apg.default.reference(ns.product),
  [ns.coproduct]: _apg.default.reference(ns.coproduct)
}); // Label


exports.value = value;

const label = _apg.default.product({
  [ns.key]: _apg.default.uri(),
  [ns.value]: value
}); // Product


exports.label = label;

const product = _apg.default.product({}); // Component


exports.product = product;

const component = _apg.default.product({
  [ns.key]: _apg.default.uri(),
  [ns.source]: _apg.default.reference(ns.product),
  [ns.value]: value
}); // Coproduct


exports.component = component;

const coproduct = _apg.default.product({}); // Option


exports.coproduct = coproduct;

const option = _apg.default.product({
  [ns.key]: _apg.default.uri(),
  [ns.source]: _apg.default.reference(ns.coproduct),
  [ns.value]: value
});

exports.option = option;

const schemaSchema = _apg.default.schema({
  [ns.label]: label,
  [ns.product]: product,
  [ns.component]: component,
  [ns.coproduct]: coproduct,
  [ns.option]: option
});

var _default = schemaSchema;
exports.default = _default;