"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isLiteralResult = isLiteralResult;
exports.makeLiteralShape = makeLiteralShape;
exports.isLiteralShape = void 0;

const isLiteralShape = shapeExpr => typeof shapeExpr !== "string" && shapeExpr.type === "NodeConstraint" && shapeExpr.hasOwnProperty("datatype");

exports.isLiteralShape = isLiteralShape;

function isLiteralResult(result, id) {
  return result.type === "NodeConstraintTest" && result.shape === id && isLiteralShape(result.shapeExpr);
}

function makeLiteralShape(id, {
  datatype
}) {
  return {
    id,
    type: "NodeConstraint",
    datatype
  };
}