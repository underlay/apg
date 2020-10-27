"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeUnitShape = makeUnitShape;
exports.isUnitResult = isUnitResult;

var _utils = require("./utils.js");

const emptyShape = {
  type: "Shape",
  closed: true,
  expression: _utils.anyType
};

function makeUnitShape(id, {}) {
  return {
    id: id,
    type: "ShapeAnd",
    shapeExprs: [_utils.blankNodeConstraint, emptyShape]
  };
}

function isUnitResult(result, id) {
  if (result.type !== "ShapeAndResults") {
    return false;
  } else if (result.solutions.length !== 2) {
    return false;
  }

  const [nodeConstraint, shape] = result.solutions;
  return (0, _utils.isBlankNodeConstraintResult)(nodeConstraint) && nodeConstraint.shape === id && isEmptyShapeResult(shape) && shape.shape === id;
}

function isEmptyShapeResult(result) {
  return result.type === "ShapeTest" && (0, _utils.isAnyTypeResult)(result.solution);
}