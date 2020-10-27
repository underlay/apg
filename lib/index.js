"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return _parse.parse;
  }
});
Object.defineProperty(exports, "parseString", {
  enumerable: true,
  get: function () {
    return _parse.parseString;
  }
});
Object.defineProperty(exports, "parseSchema", {
  enumerable: true,
  get: function () {
    return _parseSchema.parseSchema;
  }
});
Object.defineProperty(exports, "parseSchemaString", {
  enumerable: true,
  get: function () {
    return _parseSchema.parseSchemaString;
  }
});
Object.defineProperty(exports, "serialize", {
  enumerable: true,
  get: function () {
    return _serialize.serialize;
  }
});
Object.defineProperty(exports, "serializeString", {
  enumerable: true,
  get: function () {
    return _serialize.serializeString;
  }
});
Object.defineProperty(exports, "serializeSchema", {
  enumerable: true,
  get: function () {
    return _serializeSchema.serializeSchema;
  }
});
Object.defineProperty(exports, "serializeSchemaString", {
  enumerable: true,
  get: function () {
    return _serializeSchema.serializeSchemaString;
  }
});
Object.defineProperty(exports, "encode", {
  enumerable: true,
  get: function () {
    return _binary.encode;
  }
});
Object.defineProperty(exports, "decode", {
  enumerable: true,
  get: function () {
    return _binary.decode;
  }
});
exports.ns = void 0;

var ns = _interopRequireWildcard(require("./namespace.js"));

exports.ns = ns;

var _apg = _interopRequireDefault(require("./apg.js"));

var _bootstrap = _interopRequireDefault(require("./bootstrap.js"));

var _parse = require("./parse.js");

var _parseSchema = require("./parseSchema.js");

var _serialize = require("./serialize.js");

var _serializeSchema = require("./serializeSchema.js");

var _binary = require("./binary.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }