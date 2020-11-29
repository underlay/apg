"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forEntries = forEntries;
exports.getKeys = getKeys;
exports.getKeyIndex = getKeyIndex;
exports.mapKeys = mapKeys;
exports.signalInvalidType = signalInvalidType;
exports.getID = getID;
exports.freezeType = freezeType;
exports.rootId = void 0;

var _n = require("n3.ts");

var _uuid = require("uuid");

const keyMap = new WeakMap();

function* forEntries(object) {
  for (const key of getKeys(object)) {
    yield [key, object[key]];
  }
}

function getKeys(object) {
  if (keyMap.has(object)) {
    return keyMap.get(object);
  } else {
    const keys = Object.keys(object).sort();
    Object.freeze(keys);
    keyMap.set(object, keys);
    return keys;
  }
}

function getKeyIndex(object, key) {
  if (keyMap.has(object)) {
    const index = keyMap.get(object).indexOf(key);

    if (index === -1) {
      throw new Error(`Key not found: ${key}`);
    }

    return index;
  } else {
    const keys = Object.keys(object).sort();
    Object.freeze(keys);
    keyMap.set(object, keys);
    const index = keys.indexOf(key);

    if (index === -1) {
      throw new Error(`Key not found: ${key}`);
    }

    return index;
  }
}

function mapKeys(object, map) {
  const keys = getKeys(object);
  const result = Object.fromEntries(keys.map(key => [key, map(object[key], key)]));
  keyMap.set(result, keys);
  Object.freeze(result);
  return result;
}

function signalInvalidType(type) {
  console.error(type);
  throw new Error("Invalid type");
}

const rootId = (0, _uuid.v4)();
exports.rootId = rootId;

function getID() {
  let id = 0;
  return () => new _n.BlankNode(`b${id++}`);
}

function freezeType(type) {
  if (type.type === "product") {
    for (const [_, value] of forEntries(type.components)) {
      freezeType(value);
    }

    Object.freeze(type.components);
  } else if (type.type === "coproduct") {
    for (const [_, value] of forEntries(type.options)) {
      freezeType(value);
    }

    Object.freeze(type.options);
  }

  Object.freeze(type);
}