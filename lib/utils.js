"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signalInvalidType = signalInvalidType;
exports.forType = forType;
exports.forValue = forValue;
exports.equal = equal;
exports.parseObjectValue = parseObjectValue;
exports.isAnyType = isAnyType;
exports.isAnyTypeResult = isAnyTypeResult;
exports.isBlankNodeConstraintResult = isBlankNodeConstraintResult;
exports.isBlankNodeConstraint = exports.blankNodeConstraint = exports.isNodeConstraint = exports.anyType = exports.zip = exports.getBlankNodeId = void 0;

var _n = require("n3.ts");

const xsdString = new _n.NamedNode(_n.xsd.string);
const rdfLangString = new _n.NamedNode(_n.rdf.langString);

function signalInvalidType(type) {
  console.error(type);
  throw new Error("Invalid type");
}

function* forType(type, stack) {
  if (stack === undefined) {
    stack = [];
  } else if (stack.includes(type)) {
    throw new Error("Recursive type");
  }

  yield [type, stack];

  if (type.type === "product") {
    stack.push(type);

    for (const {
      value
    } of type.components) {
      yield* forType(value, stack);
    }

    stack.pop();
  } else if (type.type === "coproduct") {
    stack.push(type);

    for (const {
      value
    } of type.options) {
      yield* forType(value, stack);
    }

    stack.pop();
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

const getBlankNodeId = (type, typeCache) => type.type === "reference" ? `_:l${type.value}` : typeCache.get(type);

exports.getBlankNodeId = getBlankNodeId;

function equal(a, b) {
  if (a === b) {
    return true;
  } else if (a.type !== b.type) {
    return false;
  } else if (a.type === "reference" && b.type === "reference") {
    return a.value === b.value;
  } else if (a.type === "unit" && b.type === "unit") {
    return true;
  } else if (a.type === "iri" && b.type === "iri") {
    return true;
  } else if (a.type === "literal" && b.type === "literal") {
    return a.datatype === b.datatype;
  } else if (a.type === "product" && b.type === "product") {
    if (a.components.length !== b.components.length) {
      return false;
    }

    for (const [A, B] of zip(a.components, b.components)) {
      if (A.key !== B.key) {
        return false;
      } else if (equal(A.value, B.value)) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else if (a.type === "coproduct" && b.type === "coproduct") {
    if (a.options.length !== b.options.length) {
      return false;
    }

    for (const [A, B] of zip(a.options, b.options)) {
      if (A.key !== B.key) {
        return false;
      } else if (equal(A.value, B.value)) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
}

const zip = (...args) => ({
  [Symbol.iterator]() {
    const iterators = args.map(arg => arg[Symbol.iterator]());
    let i = 0;
    return {
      next() {
        const results = iterators.map(iter => iter.next());

        if (results.some(({
          done
        }) => done)) {
          return {
            done: true,
            value: undefined
          };
        } else {
          const values = results.map(({
            value
          }) => value);
          return {
            done: false,
            value: [...values, i++]
          };
        }
      }

    };
  }

});

exports.zip = zip;

function parseObjectValue(object) {
  if (typeof object === "string") {
    if (object.startsWith("_:")) {
      return new _n.BlankNode(object.slice(2));
    } else {
      return new _n.NamedNode(object);
    }
  } else if (object.language) {
    return new _n.Literal(object.value, object.language, rdfLangString);
  } else {
    const datatype = object.type === undefined ? xsdString : new _n.NamedNode(object.type);
    return new _n.Literal(object.value, "", datatype);
  }
}

const anyType = {
  type: "TripleConstraint",
  predicate: _n.rdf.type,
  min: 0,
  max: -1
};
exports.anyType = anyType;

function isAnyType(tripleExpr) {
  return typeof tripleExpr !== "string" && tripleExpr.type === "TripleConstraint" && tripleExpr.predicate === _n.rdf.type && tripleExpr.min === 0 && tripleExpr.max === -1 && tripleExpr.valueExpr === undefined;
}

function isAnyTypeResult(solutions) {
  return solutions.type === "TripleConstraintSolutions" && solutions.predicate === _n.rdf.type && solutions.solutions.every(isAnyTypeTripleResult);
}

function isAnyTypeTripleResult(triple) {
  return triple.predicate === _n.rdf.type && triple.referenced === undefined && typeof triple.object === "string";
}

const isNodeConstraint = shapeExpr => typeof shapeExpr !== "string" && shapeExpr.type === "NodeConstraint" && shapeExpr.hasOwnProperty("nodeKind");

exports.isNodeConstraint = isNodeConstraint;
const blankNodeConstraint = {
  type: "NodeConstraint",
  nodeKind: "bnode"
};
exports.blankNodeConstraint = blankNodeConstraint;

const isBlankNodeConstraint = shapeExpr => isNodeConstraint(shapeExpr) && shapeExpr.nodeKind === "bnode";

exports.isBlankNodeConstraint = isBlankNodeConstraint;

function isBlankNodeConstraintResult(result) {
  return result.type === "NodeConstraintTest" && isBlankNodeConstraint(result.shapeExpr);
}