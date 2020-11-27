"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
exports.validateExpressions = validateExpressions;
exports.applyExpressions = void 0;

var _type = require("./type.js");

var _utils = require("./utils.js");

const applyExpressions = (S, expressions, source) => expressions.reduce((type, expression) => apply(S, expression, type), source);

exports.applyExpressions = applyExpressions;

function apply(S, expression, source) {
  if (expression.type === "identity") {
    return source;
  } else if (expression.type === "initial") {
    throw new Error("Not implemented");
  } else if (expression.type === "terminal") {
    return Object.freeze({
      type: "unit"
    });
  } else if (expression.type === "identifier") {
    return Object.freeze({
      type: "uri"
    });
  } else if (expression.type === "constant") {
    return Object.freeze({
      type: "literal",
      datatype: expression.datatype
    });
  } else if (expression.type === "dereference") {
    if (source.type === "reference" && source.value in S && source.value === expression.key) {
      return S[source.value];
    } else {
      throw new Error("Invalid dereference morphism");
    }
  } else if (expression.type === "projection") {
    if (source.type === "product" && expression.key in source.components) {
      return source.components[expression.key];
    } else {
      throw new Error("Invalid projection morphism");
    }
  } else if (expression.type === "injection") {
    const {
      key,
      value
    } = expression;
    return Object.freeze({
      type: "coproduct",
      options: Object.freeze({
        [key]: value.reduce((type, expression) => apply(S, expression, type), source)
      })
    });
  } else if (expression.type === "tuple") {
    return Object.freeze({
      type: "product",
      components: (0, _utils.mapKeys)(expression.slots, value => applyExpressions(S, value, source))
    });
  } else if (expression.type === "match") {
    if (source.type === "coproduct") {
      const cases = Array.from(applyCases(S, source, expression));

      if (cases.length === 0) {
        throw new Error("Empty case analysis");
      } else {
        return cases.reduce(_type.unify);
      }
    } else {
      throw new Error("Invalid match morphism");
    }
  } else {
    (0, _utils.signalInvalidType)(expression);
  }
}

function* applyCases(S, source, {
  cases
}) {
  for (const key of (0, _utils.getKeys)(source.options)) {
    if (key in cases) {
      yield applyExpressions(S, cases[key], source.options[key]);
    } else {
      throw new Error("Invalid case analysis");
    }
  }
}

function validateExpressions(S, expressions, source, target) {
  let type;

  try {
    type = applyExpressions(S, expressions, source);
  } catch (e) {
    return false;
  }

  return (0, _type.isTypeAssignable)(type, target);
}