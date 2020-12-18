"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isUnit = void 0;

var _index = require("../index.js");

const isUnit = type => type.type === "product" && (0, _index.getKeys)(type.components).length === 0;

exports.isUnit = isUnit;