"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signalInvalidType = signalInvalidType;
exports.getId = getId;
exports.rootId = void 0;

var _uuid = require("uuid");

function signalInvalidType(type) {
  console.error(type);
  throw new Error("Invalid type");
}

const rootId = (0, _uuid.v4)();
exports.rootId = rootId;
let id = 0;

function getId() {
  return `${rootId}-${id++}`;
}