"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
exports.validateExpressions = validateExpressions;
exports.applyExpressions = void 0;

var _ziterable = _interopRequireDefault(require("ziterable"));

var _type = require("./type.js");

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
      type: "iri"
    });
  } else if (expression.type === "constant") {
    return Object.freeze({
      type: "literal",
      datatype: expression.datatype
    });
  } else if (expression.type === "dereference") {
    if (source.type === "reference" && source.value in S && S[source.value].key === expression.key) {
      return S[source.value].value;
    } else {
      throw new Error("Invalid dereference morphism");
    }
  } else if (expression.type === "projection") {
    if (source.type === "product") {
      const component = source.components.find(({
        key
      }) => key === expression.key);

      if (component === undefined) {
        throw new Error("Invalid projection morphism");
      } else {
        return component.value;
      }
    } else {
      throw new Error("Invalid projection morphism");
    }
  } else if (expression.type === "injection") {
    return Object.freeze({
      type: "coproduct",
      options: Object.freeze([applyOption(S, source, expression)])
    });
  } else if (expression.type === "tuple") {
    return Object.freeze({
      type: "product",
      components: Object.freeze(Array.from(applyComponents(S, source, expression)))
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
    } // } else if (expression.type === "composition") {
    // 	const [a, b] = expression.morphisms
    // 	return apply(S, b, apply(S, a, source))

  } else {
    (0, _utils.signalInvalidType)(expression);
  }
}

function applyOption(S, source, {
  value,
  key
}) {
  return Object.freeze({
    type: "option",
    key,
    value: value.reduce((type, expression) => apply(S, expression, type), source)
  });
}

function* applyComponents(S, source, {
  slots
}) {
  for (const {
    key,
    value
  } of slots) {
    yield Object.freeze({
      type: "component",
      key,
      value: applyExpressions(S, value, source)
    });
  }
}

function* applyCases(S, source, {
  cases
}) {
  for (const [option, {
    key,
    value
  }] of (0, _ziterable.default)(source.options, cases)) {
    if (option.key !== key) {
      throw new Error("Invalid case analysis");
    }

    yield applyExpressions(S, value, source);
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