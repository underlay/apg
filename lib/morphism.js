"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
exports.validateMorphism = validateMorphism;

var _ziterable = _interopRequireDefault(require("ziterable"));

var _type = require("./type.js");

var _utils = require("./utils.js");

var _value = require("./value.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function apply(schema, source, morphism) {
  if (morphism.type === "constant") {
    if (morphism.value.termType === "NamedNode") {
      return Object.freeze({
        type: "iri"
      });
    } else if (morphism.value.termType === "Literal") {
      return Object.freeze({
        type: "literal",
        datatype: morphism.value.datatype.value
      });
    } else {
      (0, _utils.signalInvalidType)(morphism.value);
    }
  } else if (morphism.type === "identity") {
    return source;
  } else if (morphism.type === "dereference") {
    if (source.type === "reference" && source.value in schema) {
      return schema[source.value].value;
    } else {
      throw new Error("Invalid dereference morphism");
    }
  } else if (morphism.type === "initial") {
    throw new Error("Not implemented");
  } else if (morphism.type === "terminal") {
    return Object.freeze({
      type: "unit"
    });
  } else if (morphism.type === "composition") {
    const [a, b] = morphism.morphisms;
    return apply(schema, apply(schema, source, a), b);
  } else if (morphism.type === "projection") {
    if (source.type === "product" && morphism.index in source.components) {
      const {
        value
      } = source.components[morphism.index];
      return value;
    } else {
      throw new Error("Invalid projection morphism");
    }
  } else if (morphism.type === "injection") {
    const {
      options,
      index
    } = morphism;

    if (index in options && (0, _type.typeEqual)(source, options[index].value)) {
      return Object.freeze({
        type: "coproduct",
        options
      });
    } else {
      throw new Error("Invalid injection morphism");
    }
  } else if (morphism.type === "tuple") {
    return Object.freeze({
      type: "product",
      components: Object.freeze(Array.from(applyComponents(schema, source, morphism)))
    });
  } else if (morphism.type === "case") {
    return Object.freeze({
      type: "coproduct",
      options: Object.freeze(Array.from(applyOptions(schema, source, morphism)))
    });
  } else {
    (0, _utils.signalInvalidType)(morphism);
  }
}

function* applyComponents(schema, source, {
  keys: keys,
  morphisms
}) {
  for (const [key, morphism] of (0, _ziterable.default)(keys, morphisms)) {
    const value = apply(schema, source, morphism);
    yield Object.freeze({
      type: "component",
      key,
      value
    });
  }
}

function* applyOptions(schema, source, {
  keys: keys,
  morphisms
}) {
  for (const [key, morphism] of (0, _ziterable.default)(keys, morphisms)) {
    const value = apply(schema, source, morphism);
    yield Object.freeze({
      type: "option",
      key,
      value
    });
  }
}

function validateMorphism(morphism, source, target, schema) {
  if (morphism.type === "constant") {
    return (0, _value.validateValue)(morphism.value, target);
  } else if (morphism.type === "dereference") {
    return source.type === "reference" && source.value in schema && (0, _type.typeEqual)(schema[source.value].value, target);
  } else if (morphism.type === "identity") {
    return (0, _type.typeEqual)(source, target);
  } else if (morphism.type === "initial") {
    return false; // TODO
  } else if (morphism.type === "terminal") {
    return target.type === "unit";
  } else if (morphism.type === "composition") {
    const type = morphism.morphisms.reduce((type, morphism) => type === null ? null : apply(schema, type, morphism), source);
    return type !== null && (0, _type.typeEqual)(type, target);
  } else if (morphism.type === "projection") {
    if (source.type !== "product") {
      return false;
    } else if (morphism.index >= source.components.length) {
      return false;
    }

    const {
      value
    } = source.components[morphism.index];
    return (0, _type.typeEqual)(value, target);
  } else if (morphism.type === "injection") {
    if (target.type !== "coproduct") {
      return false;
    } else if (morphism.index >= target.options.length) {
      return false;
    }

    const {
      value
    } = target.options[morphism.index];
    return (0, _type.typeEqual)(source, value);
  } else if (morphism.type === "tuple") {
    if (target.type !== "product") {
      return false;
    }

    const {
      morphisms,
      keys: componentKeys
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
      keys: optionKeys
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