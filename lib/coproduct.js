"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeCoproductShape = makeCoproductShape;
exports.isOptionResult = isOptionResult;
exports.isCoproductResult = isCoproductResult;
exports.parseCoproductResult = void 0;

var _n = require("n3.ts");

var _utils = require("./utils.js");

function makeCoproductShape(id, type, typeCache) {
  const expression = makeCoproductExpression(id, type, typeCache);
  return {
    id: id,
    type: "ShapeAnd",
    shapeExprs: [_utils.blankNodeConstraint, {
      type: "Shape",
      closed: true,
      expression
    }]
  };
}

function makeCoproductExpression(id, type, typeCache) {
  const expressions = [];
  const keys = new Set();

  for (const [index, {
    key,
    value
  }] of type.options.entries()) {
    if (key === _n.rdf.type) {
      throw new Error("Coproduct object cannot have an rdf:type option");
    } else if (keys.has(key)) {
      throw new Error("Coproduct objects cannot repeat option keys");
    }

    keys.add(key);
    expressions.push({
      id: `${id}-o${index}`,
      type: "TripleConstraint",
      predicate: key,
      valueExpr: (0, _utils.getBlankNodeId)(value, typeCache)
    });
  }

  return {
    type: "EachOf",
    expressions: [_utils.anyType, {
      type: "OneOf",
      expressions
    }]
  };
}

function isOptionResult(result) {
  return result.type === "TripleConstraintSolutions" && result.solutions.length === 1 && result.productionLabel !== undefined;
}

function isCoproductResult(result, id) {
  if (result.type !== "ShapeAndResults") {
    return false;
  } else if (result.solutions.length !== 2) {
    return false;
  }

  const [nodeConstraint, shape] = result.solutions;

  if (shape.type !== "ShapeTest") {
    return false;
  } else if (shape.shape !== id) {
    return false;
  } else if (shape.solution.type !== "EachOfSolutions") {
    return false;
  } else if (shape.solution.solutions.length !== 1) {
    return false;
  }

  const [{
    expressions
  }] = shape.solution.solutions;

  if (expressions.length !== 2) {
    return false;
  }

  const [first, oneOf] = expressions;

  if (oneOf.type !== "OneOfSolutions") {
    return false;
  } else if (oneOf.solutions.length !== 1) {
    return false;
  }

  const [{
    expressions: options
  }] = oneOf.solutions;

  if (options.length !== 1) {
    return false;
  }

  const [option] = options;
  return (0, _utils.isBlankNodeConstraintResult)(nodeConstraint) && nodeConstraint.shape === id && (0, _utils.isAnyTypeResult)(first) && isOptionResult(option);
} // Sorry


const parseCoproductResult = result => result.solutions[1].solution.solutions[0].expressions[1].solutions[0].expressions[0];

exports.parseCoproductResult = parseCoproductResult;