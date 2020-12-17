"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isUnit = void 0;

var _utils = require("../utils.js");

const isUnit = type => type.type === "product" && (0, _utils.getKeys)(type.components).length === 0;

exports.isUnit = isUnit;