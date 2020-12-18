"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.option = exports.coproduct = exports.component = exports.product = exports.label = exports.value = void 0;

var _index = require("../../index.js");

const value = _index.APG.coproduct({
  [_index.ns.reference]: _index.APG.reference(_index.ns.label),
  [_index.ns.uri]: _index.APG.product({}),
  [_index.ns.literal]: _index.APG.uri(),
  [_index.ns.product]: _index.APG.reference(_index.ns.product),
  [_index.ns.coproduct]: _index.APG.reference(_index.ns.coproduct)
}); // Label


exports.value = value;

const label = _index.APG.product({
  [_index.ns.key]: _index.APG.uri(),
  [_index.ns.value]: value
}); // Product


exports.label = label;

const product = _index.APG.product({}); // Component


exports.product = product;

const component = _index.APG.product({
  [_index.ns.key]: _index.APG.uri(),
  [_index.ns.source]: _index.APG.reference(_index.ns.product),
  [_index.ns.value]: value
}); // Coproduct


exports.component = component;

const coproduct = _index.APG.product({}); // Option


exports.coproduct = coproduct;

const option = _index.APG.product({
  [_index.ns.key]: _index.APG.uri(),
  [_index.ns.source]: _index.APG.reference(_index.ns.coproduct),
  [_index.ns.value]: value
});

exports.option = option;

const schemaSchema = _index.APG.schema({
  [_index.ns.label]: label,
  [_index.ns.product]: product,
  [_index.ns.component]: component,
  [_index.ns.coproduct]: coproduct,
  [_index.ns.option]: option
});

var _default = schemaSchema;
exports.default = _default;