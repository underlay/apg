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
  } else if (type.type === "unit") {
    return value.termType === "BlankNode";
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

      for (const [k, v] of (0, _ziterable.default)(keys, value)) {
        if (validateValue(type.components[k], v)) {
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
    if (value.termType === "Variant" && value.option in type.options) {
      return validateValue(type.options[value.option], value.value);
    } else {
      return false;
    }
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

function* forValue(value) {
  yield [value];

  if (value.termType === "Record") {
    for (const leaf of value) {
      yield* forValue(leaf);
    }
  } else if (value.termType === "Variant") {
    yield* forValue(value.value);
  }
}