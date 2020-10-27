"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isIriResult = isIriResult;
exports.makeIriShape = makeIriShape;
exports.isIriShape = void 0;

var _utils = require("./utils.js");

const isIriShape = shapeExpr => (0, _utils.isNodeConstraint)(shapeExpr) && shapeExpr.nodeKind === "iri" && shapeExpr.hasOwnProperty("id");

exports.isIriShape = isIriShape;

function isIriResult(result, id) {
  return result.type === "NodeConstraintTest" && result.shape === id && isIriShape(result.shapeExpr);
}

function makeIriShape(id, {}) {
  return {
    id: id,
    type: "NodeConstraint",
    nodeKind: "iri"
  };
}