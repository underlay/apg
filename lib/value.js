"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateInstance = validateInstance;
exports.validateValue = validateValue;
exports.forValue = forValue;

var _ziterable = _interopRequireDefault(require("ziterable"));

var APG = _interopRequireWildcard(require("./apg.js"));

var _utils = require("./utils.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
  if (APG.isReference(type)) {
    return value.termType === "Pointer";
  } else if (APG.isUri(type)) {
    return value.termType === "NamedNode";
  } else if (APG.isLiteral(type)) {
    return APG.isLiteralValue(value) && value.datatype.value === type.datatype;
  } else if (APG.isProduct(type)) {
    if (APG.isRecord(value)) {
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
  } else if (APG.isCoproduct(type)) {
    if (APG.isVariant(value) && value.key in type.options) {
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