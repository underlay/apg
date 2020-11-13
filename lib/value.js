"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateValue = validateValue;

var _ziterable = _interopRequireDefault(require("ziterable"));

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validateValue(value, type) {
  if (type.type === "reference") {
    return value.termType === "Pointer" && value.label === type.value;
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
        value
      }] of iter) {
        if (k === key && validateValue(v, value)) {
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
    if (value.termType === "Variant" && value.index < type.options.length) {
      const option = type.options[value.index];
      return validateValue(value.value, option.value);
    } else {
      return false;
    }
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}