"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _n = require("n3.ts");

var _index = require("../../index.js");

// 0. case
const caseLabel = _index.APG.product({
  [_index.ns.key]: _index.APG.uri(),
  [_index.ns.source]: _index.APG.reference(_index.ns.match),
  [_index.ns.value]: _index.APG.reference(_index.ns.expression)
}); // 1. expression


const expressionLabel = _index.APG.coproduct({
  [_index.ns.constant]: _index.APG.product({
    [_index.ns.datatype]: _index.APG.uri(),
    [_index.ns.value]: _index.APG.literal(_n.xsd.string)
  }),
  [_index.ns.dereference]: _index.APG.uri(),
  [_index.ns.identifier]: _index.APG.uri(),
  [_index.ns.identity]: _index.APG.product({}),
  [_index.ns.injection]: _index.APG.product({
    [_index.ns.key]: _index.APG.uri(),
    [_index.ns.value]: _index.APG.reference(_index.ns.expression)
  }),
  [_index.ns.match]: _index.APG.reference(_index.ns.match),
  [_index.ns.projection]: _index.APG.uri(),
  [_index.ns.tuple]: _index.APG.reference(_index.ns.tuple)
}); // 2. map


const mapLabel = _index.APG.product({
  [_index.ns.key]: _index.APG.uri(),
  [_index.ns.source]: _index.APG.uri(),
  [_index.ns.value]: _index.APG.reference(_index.ns.expression)
}); // 3. match


const matchLabel = _index.APG.product({}); // 4. slot


const slotLabel = _index.APG.product({
  [_index.ns.key]: _index.APG.uri(),
  [_index.ns.source]: _index.APG.reference(_index.ns.tuple),
  [_index.ns.value]: _index.APG.reference(_index.ns.expression)
}); // 5. tuple


const tupleLabel = _index.APG.product({});

const mappingSchema = _index.APG.schema({
  [_index.ns.CASE]: caseLabel,
  [_index.ns.expression]: expressionLabel,
  [_index.ns.map]: mapLabel,
  [_index.ns.match]: matchLabel,
  [_index.ns.slot]: slotLabel,
  [_index.ns.tuple]: tupleLabel
});

var _default = mappingSchema;
exports.default = _default;