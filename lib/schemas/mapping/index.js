"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _n = require("n3.ts");

var _apg = _interopRequireDefault(require("../../apg.js"));

var ns = _interopRequireWildcard(require("../../namespace.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// 0. case
const caseLabel = _apg.default.product({
  [ns.key]: _apg.default.uri(),
  [ns.source]: _apg.default.reference(ns.match),
  [ns.value]: _apg.default.reference(ns.expression)
}); // 1. expression


const expressionLabel = _apg.default.coproduct({
  [ns.constant]: _apg.default.product({
    [ns.datatype]: _apg.default.uri(),
    [ns.value]: _apg.default.literal(_n.xsd.string)
  }),
  [ns.dereference]: _apg.default.uri(),
  [ns.identifier]: _apg.default.uri(),
  [ns.identity]: _apg.default.product({}),
  [ns.injection]: _apg.default.product({
    [ns.key]: _apg.default.uri(),
    [ns.value]: _apg.default.reference(ns.expression)
  }),
  [ns.match]: _apg.default.reference(ns.match),
  [ns.projection]: _apg.default.uri(),
  [ns.tuple]: _apg.default.reference(ns.tuple)
}); // 2. map


const mapLabel = _apg.default.product({
  [ns.key]: _apg.default.uri(),
  [ns.source]: _apg.default.uri(),
  [ns.value]: _apg.default.reference(ns.expression)
}); // 3. match


const matchLabel = _apg.default.product({}); // 4. slot


const slotLabel = _apg.default.product({
  [ns.key]: _apg.default.uri(),
  [ns.source]: _apg.default.reference(ns.tuple),
  [ns.value]: _apg.default.reference(ns.expression)
}); // 5. tuple


const tupleLabel = _apg.default.product({});

const mappingSchema = _apg.default.schema({
  [ns.CASE]: caseLabel,
  [ns.expression]: expressionLabel,
  [ns.map]: mapLabel,
  [ns.match]: matchLabel,
  [ns.slot]: slotLabel,
  [ns.tuple]: tupleLabel
});

var _default = mappingSchema;
exports.default = _default;