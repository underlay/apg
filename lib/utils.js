"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forEntries = forEntries;
exports.getKeys = getKeys;
exports.getKeyIndex = getKeyIndex;
exports.mapKeys = mapKeys;
exports.signalInvalidType = signalInvalidType;
exports.rootId = void 0;

var _uuid = require("uuid");

const keyMap = new WeakMap();

function* forEntries(object) {
  for (const [index, key] of getKeys(object).entries()) {
    yield [key, object[key], index];
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