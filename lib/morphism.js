"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateMorphism = validateMorphism;

var _ziterable = _interopRequireDefault(require("ziterable"));

var _utils = require("./utils.js");

var _value = require("./value.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validateMorphism(morphism, source, target, schema) {
  if (morphism.type === "constant") {
    return (0, _value.validateValue)(morphism.value, target);
  } else if (morphism.type === "dereference") {
    return source.type === "reference" && (0, _utils.equal)(schema[source.value].value, target);
  } else if (morphism.type === "identity") {
    return (0, _utils.equal)(source, target);
  } else if (morphism.type === "initial") {
    return false; // TODO
  } else if (morphism.type === "terminal") {
    return target.type === "unit";
  } else if (morphism.type === "composition") {
    const [AB, BC] = morphism.morphisms;
    return validateMorphism(AB, source, morphism.object, schema) && validateMorphism(BC, morphism.object, target, schema);
  } else if (morphism.type === "projection") {
    if (source.type !== "product") {
      return false;
    } else if (morphism.index >= source.components.length) {
      return false;
    }

    const {
      value
    } = source.components[morphism.index];
    return (0, _utils.equal)(value, target);
  } else if (morphism.type === "injection") {
    if (target.type !== "coproduct") {
      return false;
    } else if (morphism.index >= target.options.length) {
      return false;
    }

    const {
      value
    } = target.options[morphism.index];
    return (0, _utils.equal)(source, value);
  } else if (morphism.type === "tuple") {
    if (target.type !== "product") {
      return false;
    }

    const {
      morphisms,
      componentKeys
    } = morphism;
    const {
      components
    } = target;

    if (morphisms.length !== components.length || componentKeys.length !== components.length) {
      return false;
    }

    for (const [k, m, c] of (0, _ziterable.default)(componentKeys, morphisms, components)) {
      if (k === c.key && validateMorphism(m, source, c.value, schema)) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else if (morphism.type === "case") {
    if (source.type !== "coproduct") {
      return false;
    }

    const {
      morphisms,
      optionKeys
    } = morphism;
    const {
      options
    } = source;

    if (morphisms.length !== options.length || optionKeys.length !== options.length) {
      return false;
    }

    for (const [k, m, o] of (0, _ziterable.default)(optionKeys, morphisms, options)) {
      if (k === o.key && validateMorphism(m, o.value, target, schema)) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else {
    (0, _utils.signalInvalidType)(morphism);
  }
}