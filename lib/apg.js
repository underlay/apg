"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils");

var APG;

(function (APG) {
  APG.schema = labels => Object.freeze(labels);

  APG.reference = value => Object.freeze({
    type: "reference",
    value
  });

  APG.isReference = type => type.type === "reference";

  APG.uri = () => Object.freeze({
    type: "uri"
  });

  APG.isUri = type => type.type === "uri";

  APG.literal = datatype => Object.freeze({
    type: "literal",
    datatype
  });

  APG.isLiteral = type => type.type === "literal";

  APG.product = components => Object.freeze({
    type: "product",
    components: Object.freeze(components)
  });

  APG.isProduct = type => type.type === "product";

  APG.coproduct = options => Object.freeze({
    type: "coproduct",
    options: Object.freeze(options)
  });

  APG.isCoproduct = type => type.type === "coproduct";

  APG.instance = (schema, instance) => {
    for (const [{}, values] of (0, _utils.forEntries)(instance)) {
      Object.freeze(values);
    }

    return Object.freeze(instance);
  };

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

  APG.isPointer = value => value.termType === "Pointer";

  APG.isNamedNode = value => value.termType === "NamedNode";

  APG.isLiteralValue = value => value.termType === "Literal";

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

  APG.isRecord = value => value.termType === "Record";

  const unitKeys = [];
  const unitValues = [];

  APG.unit = () => new Record(unitKeys, unitValues);

  class Variant {
    constructor(options, key, value) {
      this.options = options;
      this.key = key;
      this.value = value;
      this.index = options.indexOf(key);

      if (this.index in options) {
        Object.freeze(this);
      } else {
        throw new Error("Varint index out of range");
      }
    }

    get termType() {
      return "Variant";
    }

    is(key) {
      return key === this.key;
    }

  }

  APG.Variant = Variant;

  APG.isVariant = value => value.termType === "Variant";

  APG.identity = () => Object.freeze({
    type: "identity"
  });

  APG.identifier = value => Object.freeze({
    type: "identifier",
    value
  });

  APG.constant = (value, datatype) => Object.freeze({
    type: "constant",
    value,
    datatype
  });

  APG.dereference = key => Object.freeze({
    type: "dereference",
    key
  });

  APG.projection = key => Object.freeze({
    type: "projection",
    key
  });

  APG.injection = (key, value) => Object.freeze({
    type: "injection",
    key,
    value
  });

  APG.tuple = slots => Object.freeze({
    type: "tuple",
    slots: Object.freeze(slots)
  });

  APG.match = cases => Object.freeze({
    type: "match",
    cases: Object.freeze(cases)
  });

  APG.map = (source, value) => Object.freeze({
    type: "map",
    source,
    value
  });

  APG.mapping = maps => Object.freeze(maps);
})(APG || (APG = {}));

var _default = APG;
exports.default = _default;