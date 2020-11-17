"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signalInvalidType = signalInvalidType;
exports.getID = getID;
exports.rootId = void 0;

var _n = require("n3.ts");

var _uuid = require("uuid");

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