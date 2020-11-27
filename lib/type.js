"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forType = forType;
exports.isTypeEqual = isTypeEqual;
exports.isTypeAssignable = isTypeAssignable;
exports.unify = unify;

var _ziterable = _interopRequireDefault(require("ziterable"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function* forType(type, stack) {
  if (stack === undefined) {
    stack = [];
  } else if (stack.includes(type)) {
    throw new Error("Recursive type");
  }

  yield [type, stack];

  if (type.type === "product") {
    stack.push(type);

    for (const key of (0, _utils.getKeys)(type.components)) {
      yield* forType(type.components[key], stack);
    }

    stack.pop();
  } else if (type.type === "coproduct") {
    stack.push(type);

    for (const key of (0, _utils.getKeys)(type.options)) {
      yield* forType(type.options[key], stack);
    }

    stack.pop();
  }
}

function isTypeEqual(a, b) {
  if (a === b) {
    return true;
  } else if (a.type !== b.type) {
    return false;
  } else if (a.type === "reference" && b.type === "reference") {
    return a.value === b.value;
  } else if (a.type === "unit" && b.type === "unit") {
    return true;
  } else if (a.type === "uri" && b.type === "uri") {
    return true;
  } else if (a.type === "literal" && b.type === "literal") {
    return a.datatype === b.datatype;
  } else if (a.type === "product" && b.type === "product") {
    const A = (0, _utils.getKeys)(a.components);
    const B = (0, _utils.getKeys)(b.components);

    if (A.length !== B.length) {
      return false;
    }

    for (const [keyA, keyB] of (0, _ziterable.default)(A, B)) {
      if (keyA !== keyB) {
        return false;
      } else if (isTypeEqual(a.components[keyA], a.components[keyB])) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else if (a.type === "coproduct" && b.type === "coproduct") {
    const A = (0, _utils.getKeys)(a.options);
    const B = (0, _utils.getKeys)(b.options);

    if (A.length !== B.length) {
      return false;
    }

    for (const [keyA, keyB] of (0, _ziterable.default)(A, B)) {
      if (keyA !== keyB) {
        return false;
      } else if (isTypeEqual(a.options[keyA], b.options[keyB])) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
}

function isTypeAssignable(a, b) {
  if (a === b) {
    return true;
  } else if (a.type !== b.type) {
    return false;
  } else if (a.type === "reference" && b.type === "reference") {
    return a.value === b.value;
  } else if (a.type === "unit" && b.type === "unit") {
    return true;
  } else if (a.type === "uri" && b.type === "uri") {
    return true;
  } else if (a.type === "literal" && b.type === "literal") {
    return a.datatype === b.datatype;
  } else if (a.type === "product" && b.type === "product") {
    for (const key of (0, _utils.getKeys)(b.components)) {
      if (key in a.components && isTypeAssignable(a.components[key], b.components[key])) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else if (a.type === "coproduct" && b.type === "coproduct") {
    for (const key of (0, _utils.getKeys)(a.options)) {
      if (key in b.options && isTypeAssignable(a.options[key], b.options[key])) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
}

function unify(a, b) {
  if (a === b) {
    return b;
  } else if (a.type === "reference" && b.type === "reference") {
    if (a.value === b.value) {
      return b;
    }
  } else if (a.type === "unit" && b.type === "unit") {
    return b;
  } else if (a.type === "uri" && b.type === "uri") {
    return b;
  } else if (a.type === "literal" && b.type === "literal") {
    if (a.datatype === b.datatype) {
      return b;
    }
  } else if (a.type === "product" && b.type === "product") {
    const components = Object.fromEntries(unifyComponents(a, b));
    Object.freeze(components);
    return Object.freeze({
      type: "product",
      components
    });
  }

  if (a.type === "coproduct" && b.type === "coproduct") {
    const options = Object.fromEntries(unifyOptions(a, b));
    Object.freeze(options);
    return Object.freeze({
      type: "coproduct",
      options
    });
  } else {
    throw new Error("Cannot unify unequal types");
  }
}

function* unifyComponents(a, b) {
  const A = (0, _utils.getKeys)(a.components);
  const B = (0, _utils.getKeys)(b.components);

  if (A.length !== B.length) {
    throw new Error("Cannot unify unequal products");
  }

  for (const [keyA, keyB] of (0, _ziterable.default)(A, B)) {
    if (keyA !== keyB) {
      throw new Error("Cannot unify unequal types");
    } else {
      yield [keyA, unify(a.components[keyA], b.components[keyB])];
    }
  }
}

function* unifyOptions(a, b) {
  const keys = Array.from(new Set([...(0, _utils.getKeys)(a.options), ...(0, _utils.getKeys)(b.options)])).sort();

  for (const key of keys) {
    const A = a.options[key];
    const B = b.options[key];

    if (A !== undefined && B === undefined) {
      yield [key, A];
    } else if (A === undefined && B !== undefined) {
      yield [key, B];
    } else if (A !== undefined && B !== undefined) {
      yield [key, unify(A, B)];
    } else {
      throw new Error("Error unifying options");
    }
  }
}