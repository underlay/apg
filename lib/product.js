"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeProductShape = makeProductShape;
exports.isComponentResult = isComponentResult;
exports.isProductResult = isProductResult;
exports.parseProductResult = parseProductResult;

var _n = require("n3.ts");

var _utils = require("./utils.js");

function makeProductShape(id, type, typeCache) {
  const expression = makeProductExpression(id, type, typeCache);
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

function makeProductExpression(id, type, typeCache) {
  const expressions = [_utils.anyType];
  const keys = new Set();

  for (const [index, {
    key,
    value
  }] of type.components.entries()) {
    if (key === _n.rdf.type) {
      throw new Error("Product object cannot have an rdf:type component");
    } else if (keys.has(key)) {
      throw new Error("Product objects cannot repeat component keys");
    }

    keys.add(key);
    expressions.push({
      id: `${id}-c${index}`,
      type: "TripleConstraint",
      predicate: key,
      valueExpr: (0, _utils.getBlankNodeId)(value, typeCache)
    });
  }

  return {
    type: "EachOf",
    expressions
  };
}

function isComponentResult(result) {
  return result.type === "TripleConstraintSolutions" && result.solutions.length === 1 && result.productionLabel !== undefined;
}

function isProductResult(result, id) {
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
  const [first, ...rest] = expressions;
  return (0, _utils.isBlankNodeConstraintResult)(nodeConstraint) && nodeConstraint.shape === id && (0, _utils.isAnyTypeResult)(first) && rest.every(isComponentResult);
}

function parseProductResult(result) {
  const [{}, shape] = result.solutions;
  const [{
    expressions
  }] = shape.solution.solutions;
  const [{}, ...rest] = expressions;
  return rest;
}