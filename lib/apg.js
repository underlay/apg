"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var APG;

(function (APG) {
  class Pointer {
    constructor(index) {
      this.index = index;
      Object.freeze(this);
    }

    get termType() {
      return "Pointer";
    }

  }

  APG.Pointer = Pointer;

  class Record extends Array {
    constructor(components, values) {
      super(...values);
      this.components = components;
      Object.freeze(this);
    }

    get termType() {
      return "Record";
    }

    get(key) {
      const index = this.components.indexOf(key);

      if (index in this) {
        return this[index];
      } else {
        throw new Error(`Index out of range: ${index}`);
      }
    }

    map(f) {
      const result = new Array(this.length);

      for (const [i, value] of this.entries()) {
        result[i] = f(value, i, this);
      }

      return result;
    }

  }

  APG.Record = Record;

  class Variant {
    constructor(options, index, value) {
      this.options = options;
      this.index = index;
      this.value = value;

      if (index in options) {
        Object.freeze(this);
      } else {
        throw new Error("Varint index out of range");
      }
    }

    get option() {
      return this.options[this.index];
    }

    get termType() {
      return "Variant";
    }

  }

  APG.Variant = Variant;
})(APG || (APG = {}));

var _default = APG;
exports.default = _default;