"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  APG: true,
  schemaSchema: true,
  ns: true
};
Object.defineProperty(exports, "APG", {
  enumerable: true,
  get: function () {
    return _apg.default;
  }
});
Object.defineProperty(exports, "schemaSchema", {
  enumerable: true,
  get: function () {
    return _bootstrap.default;
  }
});
exports.ns = void 0;

var _apg = _interopRequireDefault(require("./apg.js"));

var _bootstrap = _interopRequireDefault(require("./bootstrap.js"));

var ns = _interopRequireWildcard(require("./namespace.js"));

exports.ns = ns;

var _morphism = require("./morphism.js");

Object.keys(_morphism).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _morphism[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _morphism[key];
    }
  });
});

var _path = require("./path.js");

Object.keys(_path).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _path[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _path[key];
    }
  });
});

var _value = require("./value.js");

Object.keys(_value).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _value[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _value[key];
    }
  });
});

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }