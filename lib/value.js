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
  } else if (type.type === "iri") {
    return value.termType === "NamedNode";
  } else if (type.type === "literal") {
    return value.termType === "Literal" && value.datatype.value === type.datatype;
  } else if (type.type === "product") {
    if (value.termType === "Record" && value.length === type.components.length) {
      const iter = (0, _ziterable.default)(value.componentKeys, value, type.components);

      for (const [k, v, {
        key,
        value: t
      }] of iter) {
        if (k === key && validateValue(t, v)) {
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
    if (value.termType === "Variant") {
      const option = type.options.find(({
        key
      }) => key === value.key);
      return option !== undefined && validateValue(option.value, value.value);
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