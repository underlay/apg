"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateInstance = validateInstance;
exports.validateValue = validateValue;
exports.forValue = forValue;

var _ziterable = _interopRequireDefault(require("ziterable"));

var _apg = _interopRequireDefault(require("./apg.js"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validateInstance(schema, instance) {
  const iter = (0, _ziterable.default)((0, _utils.forEntries)(schema), (0, _utils.forEntries)(instance));

  for (const [[k1, type], [k2, values]] of iter) {
    if (k1 !== k2) {
      return false;
    }

    for (const value of values) {
      if (validateValue(type, value)) {
        continue;
      } else {
        return false;
      }
    }
  }

  return true;
}

function validateValue(type, value) {
  if (_apg.default.isReference(type)) {
    return value.termType === "Pointer";
  } else if (_apg.default.isUri(type)) {
    return value.termType === "NamedNode";
  } else if (_apg.default.isLiteral(type)) {
    return _apg.default.isLiteralValue(value) && value.datatype.value === type.datatype;
  } else if (_apg.default.isProduct(type)) {
    if (_apg.default.isRecord(value)) {
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
  } else if (_apg.default.isCoproduct(type)) {
    if (_apg.default.isVariant(value) && value.key in type.options) {
      return validateValue(type.options[value.key], value.value);
    } else {
      return false;
    }
  } else {
    console.error(type);
    throw new Error("Unexpected type");
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