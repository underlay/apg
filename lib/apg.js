"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var APG;

(function (APG) {
  class Pointer {
    constructor(index, label) {
      this.index = index;
      this.label = label;
      Object.freeze(this);
    }

    get termType() {
      return "Pointer";
    }

  }

  APG.Pointer = Pointer;

  class Record extends Array {
    constructor(node, componentKeys, values) {
      super(...values);
      this.node = node;
      this.componentKeys = componentKeys;
      Object.freeze(this);
    }

    map(f) {
      const result = new Array(this.length);

      for (const [i, value] of this.entries()) {
        result[i] = f(value, i, this);
      }

      return result;
    }

    get termType() {
      return "Record";
    }

    get(key) {
      const index = this.componentKeys.indexOf(key);

      if (index === -1) {
        throw new Error("Key not found");
      } else {
        return this[index];
      }
    }

  }

  APG.Record = Record;

  class Variant {
    constructor(node, optionKeys, index, value) {
      this.node = node;
      this.optionKeys = optionKeys;
      this.index = index;
      this.value = value;
      Object.freeze(this);
    }

    get termType() {
      return "Variant";
    }

    get key() {
      return this.optionKeys[this.index];
    }

  }

  APG.Variant = Variant;
})(APG || (APG = {}));

var _default = APG;
exports.default = _default;