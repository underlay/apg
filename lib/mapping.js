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

var _path = require("./path.js");

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function validateMapping([M1, M2], S, T) {
  for (const [{
    value
  }, path, expressions] of (0, _ziterable.default)(S, M1, M2)) {
    const source = (0, _path.getType)(T, path);
    const target = fold(M1, T, value);

    if ((0, _morphism.validateExpressions)(S, expressions, source, target)) {
      continue;
    } else {
      return false;
    }
  }

  return true;
}

function fold(M1, T, type) {
  if (type.type === "reference") {
    const value = (0, _path.getType)(T, M1[type.value]);

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
        value: fold(M1, T, value)
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
        value: fold(M1, T, value)
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

const mapExpressions = (expressions, value, instance, schema, id) => expressions.reduce((value, expression) => map(expression, value, instance, schema, id), value);

exports.mapExpressions = mapExpressions;

function map(expression, value, instance, schema, id) {
  if (expression.type === "identity") {
    return value;
  } else if (expression.type === "initial") {
    throw new Error("Not implemented");
  } else if (expression.type === "terminal") {
    if (value.termType === "BlankNode") {
      return value;
    } else {
      throw new Error("Invalid terminal expression");
    }
  } else if (expression.type === "identifier") {
    return expression.value;
  } else if (expression.type === "constant") {
    return expression.value;
  } else if (expression.type === "dereference") {
    if (value.termType === "Pointer") {
      const index = schema.findIndex(({
        key
      }) => key === expression.key);

      if (index in instance && value.index in instance[index]) {
        return instance[index][value.index];
      } else {
        throw new Error("Invalid pointer dereference");
      }
    } else {
      throw new Error("Invalid pointer dereference");
    }
  } else if (expression.type === "projection") {
    if (value.termType === "Record") {
      const index = value.componentKeys.indexOf(expression.key);

      if (index in value) {
        return value[index];
      } else {
        throw new Error("Invalid projection");
      }
    } else {
      throw new Error("Invalid projection");
    }
  } else if (expression.type === "match") {
    if (value.termType === "Variant") {
      const c = expression.cases.find(({
        key
      }) => key === value.key);

      if (c !== undefined) {
        return mapExpressions(c.value, value.value, instance, schema, id);
      } else {
        throw new Error("Invalid case analysis");
      }
    } else {
      throw new Error("Invalid match morphism");
    }
  } else if (expression.type === "tuple") {
    const keys = expression.slots.map(({
      key
    }) => key);
    Object.freeze(keys);
    return new _apg.default.Record(id(), keys, expression.slots.map(slot => mapExpressions(slot.value, value, instance, schema, id)));
  } else if (expression.type === "injection") {
    return new _apg.default.Variant(id(), expression.key, mapExpressions(expression.value, value, instance, schema, id));
  } else {
    (0, _utils.signalInvalidType)(expression);
  }
}

function delta(M, S, T, TI) {
  const [M1, M2] = M;
  const SI = M1.map(() => []);
  const indices = M1.map(() => new Map());
  const id = (0, _utils.getID)();

  for (const [{
    value: type
  }, path, expressions, i] of (0, _ziterable.default)(S, M1, M2)) {
    for (const value of (0, _path.getValues)(T, TI, path)) {
      if (indices[i].has(value)) {
        continue;
      } else {
        const imageValue = mapExpressions(expressions, value, TI, T, id);
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
      return new _apg.default.Pointer(index);
    } else {
      // Otherwise, we map value along the morphism M2[type.value].
      // This gives us a value that is an instance of the image of the referenced type
      // - ie an instance of fold(M1, T, S[type.value].value)
      const t = S[type.value].value;
      const v = mapExpressions(M2[type.value], value, TI, T, id);
      const index = SI[type.value].push(placeholder) - 1;
      indices[type.value].set(value, index);
      const p = pullback(M, S, T, SI, TI, indices, id, t, v);
      SI[type.value][index] = p;
      return new _apg.default.Pointer(index);
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
      const option = type.options.find(({
        key
      }) => key === value.key);

      if (option === undefined) {
        throw new Error("Invalid image variant");
      } else {
        return new _apg.default.Variant(value.node, value.key, pullback(M, S, T, SI, TI, indices, id, option.value, value.value));
      }
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