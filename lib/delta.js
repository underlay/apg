"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = diff;

var _utils = require("./utils.js");

function diff(a, b) {
  for (const key in (0, _utils.getKeys)(a)) {
    if (key in b) {
      diffTypes(a[key], b[key]);
    }
  }

  return null;
}

function diffTypes(a, b) {
  // if (b.type === "unit") {
  // 	return [{ type: "terminal" }]
  // } else if (b.type === "uri") {
  // 	// if (a.type === )
  // }
  return null;
}