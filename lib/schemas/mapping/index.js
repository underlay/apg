"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _n = require("n3.ts");

var APG = _interopRequireWildcard(require("../../apg.js"));

var ns = _interopRequireWildcard(require("../../namespace.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// 0. case
const caseLabel = APG.product({
  [ns.key]: APG.uri(),
  [ns.source]: APG.reference(ns.match),
  [ns.value]: APG.reference(ns.expression)
}); // 1. expression

const expressionLabel = APG.coproduct({
  [ns.constant]: APG.product({
    [ns.datatype]: APG.uri(),
    [ns.value]: APG.literal(_n.xsd.string)
  }),
  [ns.dereference]: APG.uri(),
  [ns.identifier]: APG.uri(),
  [ns.identity]: APG.product({}),
  [ns.injection]: APG.product({
    [ns.key]: APG.uri(),
    [ns.value]: APG.reference(ns.expression)
  }),
  [ns.match]: APG.reference(ns.match),
  [ns.projection]: APG.uri(),
  [ns.tuple]: APG.reference(ns.tuple)
}); // 2. map

const mapLabel = APG.product({
  [ns.key]: APG.uri(),
  [ns.source]: APG.uri(),
  [ns.value]: APG.reference(ns.expression)
}); // 3. match

const matchLabel = APG.product({}); // 4. slot

const slotLabel = APG.product({
  [ns.key]: APG.uri(),
  [ns.source]: APG.reference(ns.tuple),
  [ns.value]: APG.reference(ns.expression)
}); // 5. tuple

const tupleLabel = APG.product({});
const mappingSchema = APG.schema({
  [ns.CASE]: caseLabel,
  [ns.expression]: expressionLabel,
  [ns.map]: mapLabel,
  [ns.match]: matchLabel,
  [ns.slot]: slotLabel,
  [ns.tuple]: tupleLabel
});
var _default = mappingSchema;
exports.default = _default;