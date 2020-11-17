"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateMapping = validateMapping;
exports.fold = fold;
exports.map = map;
exports.delta = delta;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _ziterable = _interopRequireDefault(require("ziterable"));

var _apg = _interopRequireDefault(require("./apg.js"));

var _morphism = require("./morphism.js");

var _path = require("./path.js");

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function validateMapping([m1, m2], source, target) {
  for (const [{
    value
  }, path, morphism] of (0, _ziterable.default)(source, m1, m2)) {
    const type = (0, _path.getType)(target, path);

    if ((0, _morphism.validateMorphism)(morphism, type, fold(m1, value, target), target)) {
      continue;
    } else {
      return false;
    }
  }

  return true;
}

function fold(m1, type, target) {
  if (type.type === "reference") {
    const value = (0, _path.getType)(target, m1[type.value]);

    if (value === undefined) {
      throw new Error("Invalid reference index");
    } else {
      return value;
    }
  } else if (type.type === "unit") {
    return type;
  } else if (type.type === "iri") {
    return type;
  } else if (type.type === "literal") {
    return type;
  } else if (type.type === "product") {
    const components = [];

    for (const {
      key,
      value
    } of type.components) {
      components.push(Object.freeze({
        type: "component",
        key,
        value: fold(m1, value, target)
      }));
    }

    Object.freeze(components);
    return Object.freeze({
      type: "product",
      components
    });
  } else if (type.type === "coproduct") {
    const options = [];

    for (const {
      key,
      value
    } of type.options) {
      options.push(Object.freeze({
        type: "option",
        key,
        value: fold(m1, value, target)
      }));
    }

    Object.freeze(options);
    return Object.freeze({
      type: "coproduct",
      options
    });
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

function map(morphism, value, instance, id) {
  if (morphism.type === "identity") {
    return value;
  } else if (morphism.type === "initial") {
    throw new Error("Invalid initial morphism");
  } else if (morphism.type === "terminal") {
    if (value.termType === "BlankNode") {
      return value;
    } else {
      throw new Error("Invalid terminal morphism");
    }
  } else if (morphism.type === "dereference") {
    if (value.termType === "Pointer") {
      return instance[value.label][value.index];
    } else {
      throw new Error("Invalid pointer dereference");
    }
  } else if (morphism.type === "constant") {
    return morphism.value;
  } else if (morphism.type === "composition") {
    const [f, g] = morphism.morphisms;
    return map(g, map(f, value, instance, id), instance, id);
  } else if (morphism.type === "projection") {
    if (value.termType === "Record" && morphism.index in value) {
      return value[morphism.index];
    } else {
      console.error(value, morphism);
      throw new Error("Invalid projection");
    }
  } else if (morphism.type === "case") {
    if (value.termType === "Variant" && value.optionKeys[value.index] === morphism.keys[value.index]) {
      return map(morphism.morphisms[value.index], value.value, instance, id);
    } else {
      throw new Error("Invalid case analysis");
    }
  } else if (morphism.type === "tuple") {
    return new _apg.default.Record(id(), morphism.keys, morphism.morphisms.map(morphism => map(morphism, value, instance, id)));
  } else if (morphism.type === "injection") {
    const optionKeys = morphism.options.map(({
      key
    }) => key);
    Object.freeze(optionKeys);
    return new _apg.default.Variant(id(), optionKeys, morphism.index, value);
  } else {
    (0, _utils.signalInvalidType)(morphism);
  }
}

function delta(M, S, T, TI) {
  const [M1, M2] = M;
  const SI = M1.map(() => []);
  const indices = M1.map(() => new Map());
  const id = (0, _utils.getID)();

  for (const [{
    value: type
  }, path, morphism, i] of (0, _ziterable.default)(S, M1, M2)) {
    for (const value of (0, _path.getValues)(TI, path)) {
      if (indices[i].has(value)) {
        continue;
      } else {
        const imageValue = map(morphism, value, TI, id);
        const index = SI[i].push(placeholder) - 1;
        indices[i].set(value, index);
        SI[i][index] = pullback(M, S, T, SI, TI, indices, id, type, imageValue);
      }
    }
  }

  for (const values of SI) {
    Object.freeze(values);
  }

  Object.freeze(SI);
  return SI;
}

const placeholder = new N3.NamedNode(_utils.rootId);

function pullback(M, S, T, SI, TI, indices, id, type, // in source
value // of image
) {
  const [{}, M2] = M;

  if (type.type === "reference") {
    // Here we actually know that value is an instance of M1[type.value]
    // So now what?
    // First we check to see if the value is in the index cache.
    // (We're ultimately going to return a Pointer for sure)
    const index = indices[type.value].get(value);

    if (index !== undefined) {
      return new _apg.default.Pointer(index, type.value);
    } else {
      // Otherwise, we map value along the morphism M2[type.value].
      // This gives us a value that is an instance of the image of the referenced type
      // - ie an instance of fold(M1, S[type.value].value, T)
      const t = S[type.value].value;
      const v = map(M2[type.value], value, TI, id);
      const index = SI[type.value].push(placeholder) - 1;
      indices[type.value].set(value, index);
      const p = pullback(M, S, T, SI, TI, indices, id, t, v);
      SI[type.value][index] = p;
      return new _apg.default.Pointer(index, type.value);
    }
  } else if (type.type === "unit") {
    if (value.termType !== "BlankNode") {
      throw new Error("Invalid image value: expected blank node");
    } else {
      return value;
    }
  } else if (type.type === "iri") {
    if (value.termType !== "NamedNode") {
      throw new Error("Invalid image value: expected iri");
    } else {
      return value;
    }
  } else if (type.type === "literal") {
    if (value.termType !== "Literal") {
      throw new Error("Invalid image value: expected literal");
    } else {
      return value;
    }
  } else if (type.type === "product") {
    if (value.termType !== "Record") {
      throw new Error("Invalid image value: expected record");
    } else {
      return new _apg.default.Record(value.node, value.componentKeys, pullbackComponents(M, S, T, SI, TI, indices, id, type, value));
    }
  } else if (type.type === "coproduct") {
    if (value.termType !== "Variant") {
      throw new Error("Invalid image value: expected variant");
    } else {
      const {
        value: t
      } = type.options[value.index];
      return new _apg.default.Variant(value.node, value.optionKeys, value.index, pullback(M, S, T, SI, TI, indices, id, t, value.value));
    }
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

function* pullbackComponents(M, S, T, SI, TI, indices, id, type, value) {
  for (const [t, field] of (0, _ziterable.default)(type.components, value)) {
    yield pullback(M, S, T, SI, TI, indices, id, t.value, field);
  }
}