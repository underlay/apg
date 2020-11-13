"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forType = forType;
exports.typeEqual = typeEqual;

var _ziterable = _interopRequireDefault(require("ziterable"));

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

    for (const {
      value
    } of type.components) {
      yield* forType(value, stack);
    }

    stack.pop();
  } else if (type.type === "coproduct") {
    stack.push(type);

    for (const {
      value
    } of type.options) {
      yield* forType(value, stack);
    }

    stack.pop();
  }
}

function typeEqual(a, b) {
  if (a === b) {
    return true;
  } else if (a.type !== b.type) {
    return false;
  } else if (a.type === "reference" && b.type === "reference") {
    return a.value === b.value;
  } else if (a.type === "unit" && b.type === "unit") {
    return true;
  } else if (a.type === "iri" && b.type === "iri") {
    return true;
  } else if (a.type === "literal" && b.type === "literal") {
    return a.datatype === b.datatype;
  } else if (a.type === "product" && b.type === "product") {
    if (a.components.length !== b.components.length) {
      return false;
    }

    for (const [A, B] of (0, _ziterable.default)(a.components, b.components)) {
      if (A.key !== B.key) {
        return false;
      } else if (typeEqual(A.value, B.value)) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else if (a.type === "coproduct" && b.type === "coproduct") {
    if (a.options.length !== b.options.length) {
      return false;
    }

    for (const [A, B] of (0, _ziterable.default)(a.options, b.options)) {
      if (A.key !== B.key) {
        return false;
      } else if (typeEqual(A.value, B.value)) {
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