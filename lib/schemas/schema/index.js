"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var ns = _interopRequireWildcard(require("../../namespace.js"));

var _utils = require("../../utils.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const anyValue = {
  type: "coproduct",
  options: {
    [ns.reference]: {
      type: "reference",
      value: ns.label
    },
    [ns.unit]: {
      type: "unit"
    },
    [ns.uri]: {
      type: "unit"
    },
    [ns.literal]: {
      type: "uri"
    },
    [ns.product]: {
      type: "reference",
      value: ns.product
    },
    [ns.coproduct]: {
      type: "reference",
      value: ns.coproduct
    }
  }
}; // Label

const labelLabel = {
  type: "product",
  components: {
    [ns.key]: {
      type: "uri"
    },
    [ns.value]: anyValue
  }
}; // Product

const productLabel = {
  type: "unit"
}; // Component

const componentLabel = {
  type: "product",
  components: {
    [ns.key]: {
      type: "uri"
    },
    [ns.source]: {
      type: "reference",
      value: ns.product
    },
    [ns.value]: anyValue
  }
}; // Coproduct

const coproductLabel = {
  type: "unit"
}; // Option

const optionLabel = {
  type: "product",
  components: {
    [ns.key]: {
      type: "uri"
    },
    [ns.source]: {
      type: "reference",
      value: ns.coproduct
    },
    [ns.value]: anyValue
  }
};
const schemaSchema = {
  [ns.label]: labelLabel,
  [ns.product]: productLabel,
  [ns.component]: componentLabel,
  [ns.coproduct]: coproductLabel,
  [ns.option]: optionLabel
};

for (const [_, label] of (0, _utils.getEntries)(schemaSchema)) {
  (0, _utils.freezeType)(label);
}

Object.freeze(schemaSchema);
var _default = schemaSchema;
exports.default = _default;