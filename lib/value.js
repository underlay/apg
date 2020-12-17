"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateValue = validateValue;
exports.forValue = forValue;

var _ziterable = _interopRequireDefault(require("ziterable"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validateValue(type, value) {
  if (type.type === "reference") {
    return value.termType === "Pointer";
  } else if (type.type === "uri") {
    return value.termType === "NamedNode";
  } else if (type.type === "literal") {
    return value.termType === "Literal" && value.datatype.value === type.datatype;
  } else if (type.type === "product") {
    if (value.termType === "Record") {
      const keys = (0, _utils.getKeys)(type.components);

      if (keys.length !== value.length) {
        return false;
      }

      for (const [k1, k2, v] of (0, _ziterable.default)(keys, value.components, value)) {
        if (k1 !== k2) {
          return false;
        } else if (validateValue(type.components[k1], v)) {
          continue;
        } else {
          return false;
        }
      }

      return true;
    } else {
      return false;
    }
  } else if (type.type === "coproduct") {
    if (value.termType === "Variant" && value.key in type.options) {
      return validateValue(type.options[value.key], value.value);
    } else {
      return false;
    }
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

function* forValue(value, stack = []) {
  if (stack.includes(value)) {
    throw new Error("Recursive type");
  }

  yield [value, stack];

  if (value.termType === "Record") {
    stack.push(value);

    for (const leaf of value) {
      yield* forValue(leaf, stack);
    }

    stack.pop();
  } else if (value.termType === "Variant") {
    stack.push(value);
    yield* forValue(value.value, stack);
    stack.pop();
  }
}