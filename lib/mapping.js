"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateMapping = validateMapping;
exports.fold = fold;
exports.map = map;
exports.delta = delta;
exports.mapExpressions = void 0;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _ziterable = _interopRequireDefault(require("ziterable"));

var _apg = _interopRequireDefault(require("./apg.js"));

var _morphism = require("./morphism.js");

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function validateMapping(M, S, T) {
  for (const [key, type] of (0, _utils.forEntries)(S)) {
    if (!(key in M)) {
      return false;
    }

    const {
      source,
      value
    } = M[key];

    if ((0, _morphism.validateExpressions)(S, value, T[source], fold(M, S, T, type))) {
      continue;
    } else {
      return false;
    }
  }

  return true;
}

function fold(M, S, T, type) {
  if (type.type === "reference") {
    const {
      source
    } = M[type.value];
    const value = T[source];

    if (value === undefined) {
      throw new Error("Invalid reference index");
    } else {
      return value;
    }
  } else if (type.type === "uri") {
    return type;
  } else if (type.type === "literal") {
    return type;
  } else if (type.type === "product") {
    return _apg.default.product((0, _utils.mapKeys)(type.components, value => fold(M, S, T, value)));
  } else if (type.type === "coproduct") {
    return _apg.default.coproduct((0, _utils.mapKeys)(type.options, value => fold(M, S, T, value)));
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

const mapExpressions = (expressions, value, instance, schema) => expressions.reduce((value, expression) => map(expression, value, instance, schema), value);

exports.mapExpressions = mapExpressions;

function map(expression, value, instance, schema) {
  if (expression.type === "identity") {
    return value;
  } else if (expression.type === "identifier") {
    return new N3.NamedNode(expression.value);
  } else if (expression.type === "constant") {
    return new N3.Literal(expression.value, "", new N3.NamedNode(expression.datatype));
  } else if (expression.type === "dereference") {
    if (value.termType === "Pointer") {
      const {
        key
      } = expression;

      if (key in instance && value.index in instance[key]) {
        return instance[key][value.index];
      } else {
        throw new Error("Invalid pointer dereference");
      }
    } else {
      throw new Error("Invalid pointer dereference");
    }
  } else if (expression.type === "projection") {
    if (value.termType === "Record") {
      return value.get(expression.key);
    } else {
      throw new Error("Invalid projection");
    }
  } else if (expression.type === "match") {
    if (value.termType === "Variant") {
      if (value.key in expression.cases) {
        const c = expression.cases[value.key];
        return mapExpressions(c, value.value, instance, schema);
      } else {
        throw new Error("Invalid case analysis");
      }
    } else {
      throw new Error("Invalid match morphism");
    }
  } else if (expression.type === "tuple") {
    const keys = (0, _utils.getKeys)(expression.slots);
    return new _apg.default.Record(keys, keys.map(key => mapExpressions(expression.slots[key], value, instance, schema)));
  } else if (expression.type === "injection") {
    return new _apg.default.Variant(Object.freeze([expression.key]), expression.key, mapExpressions(expression.value, value, instance, schema));
  } else {
    (0, _utils.signalInvalidType)(expression);
  }
}

function delta(M, S, T, TI) {
  const SI = (0, _utils.mapKeys)(S, () => []);
  const indices = (0, _utils.mapKeys)(S, () => new Map());

  for (const [key, type] of (0, _utils.forEntries)(S)) {
    if (!(key in M) || !(key in indices)) {
      throw new Error("Invalid mapping");
    }

    const {
      source
    } = M[key];

    if (!(source in TI)) {
      throw new Error("Invalid instance");
    }

    for (const value of TI[source]) {
      if (indices[key].has(value)) {
        continue;
      } else {
        const imageValue = mapExpressions(M[key].value, value, TI, T);
        const i = SI[key].push(placeholder) - 1;
        indices[key].set(value, i);
        SI[key][i] = pullback({
          M,
          S,
          T,
          SI,
          TI,
          indices
        }, type, imageValue);
      }
    }
  }

  for (const key of (0, _utils.getKeys)(S)) {
    Object.freeze(SI[key]);
  }

  Object.freeze(SI);
  return SI;
}

const placeholder = new N3.NamedNode(_utils.rootId);

function pullback(state, type, // in source
value // of image
) {
  if (type.type === "reference") {
    // Here we actually know that value is an instance of M1[type.value]
    // So now what?
    // First we check to see if the value is in the index cache.
    // (We're ultimately going to return a Pointer for sure)
    const index = state.indices[type.value].get(value);

    if (index !== undefined) {
      return new _apg.default.Pointer(index);
    } else {
      // Otherwise, we map value along the morphism M2[type.value].
      // This gives us a value that is an instance of the image of the referenced type
      // - ie an instance of fold(M1, T, S[type.value].value)
      const t = state.S[type.value];
      const m = state.M[type.value];
      const v = mapExpressions(m.value, value, state.TI, state.T);
      const index = state.SI[type.value].push(placeholder) - 1;
      state.indices[type.value].set(value, index);
      const p = pullback(state, t, v);
      state.SI[type.value][index] = p;
      return new _apg.default.Pointer(index);
    }
  } else if (type.type === "uri") {
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
      return new _apg.default.Record(value.components, pullbackComponents(state, type, value));
    }
  } else if (type.type === "coproduct") {
    if (value.termType !== "Variant") {
      throw new Error("Invalid image value: expected variant");
    } else if (value.key in type.options) {
      return new _apg.default.Variant(value.options, value.key, pullback(state, type.options[value.key], value.value));
    } else {
      throw new Error("Invalid image variant");
    }
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

function* pullbackComponents(state, type, value) {
  for (const [k1, k2, field] of (0, _ziterable.default)((0, _utils.getKeys)(type.components), value.components, value)) {
    if (k1 === k2) {
      yield pullback(state, type.components[k1], field);
    } else {
      throw new Error("Invalid image record");
    }
  }
}