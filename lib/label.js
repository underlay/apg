"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeLabelShape = makeLabelShape;
exports.isLabelResult = isLabelResult;
exports.parseLabelResult = parseLabelResult;

var _n = require("n3.ts");

var _utils = require("./utils.js");

function makeLabelShape(id, label, typeCache) {
  return {
    id: id,
    type: "ShapeAnd",
    shapeExprs: [{
      type: "Shape",
      extra: [_n.rdf.type],
      expression: {
        type: "TripleConstraint",
        predicate: _n.rdf.type,
        valueExpr: {
          type: "NodeConstraint",
          values: [label.key]
        }
      }
    }, (0, _utils.getBlankNodeId)(label.value, typeCache)]
  };
}

function isLabelResult(result, id, key) {
  if (result.type !== "ShapeAndResults") {
    return false;
  } else if (result.solutions.length !== 2) {
    return false;
  }

  const [shape] = result.solutions;

  if (shape.type !== "ShapeTest") {
    return false;
  } else if (shape.shape !== id) {
    return false;
  } else if (shape.solution.type !== "TripleConstraintSolutions") {
    return false;
  } else if (shape.solution.predicate !== _n.rdf.type) {
    return false;
  } else if (shape.solution.solutions.length !== 1) {
    return false;
  }

  const [{
    object,
    predicate
  }] = shape.solution.solutions;
  return object === key && predicate === _n.rdf.type;
}

function parseLabelResult(result) {
  const [{}, nextResult] = result.solutions;
  return nextResult;
}