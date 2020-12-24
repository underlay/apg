"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = diff;

var APG = _interopRequireWildcard(require("./apg.js"));

var _utils = require("./utils.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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