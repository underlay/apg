"use strict";

var _n = require("n3.ts");

var _apg = _interopRequireDefault(require("./apg.js"));

var _mapping = require("./mapping.js");

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getMigrationTestSchemas() {
  const S = [{
    type: "label",
    key: "http://example.com/a",
    value: {
      type: "product",
      components: [{
        type: "component",
        key: "http://example.com/a/a",
        value: {
          type: "product",
          components: [{
            type: "component",
            key: "http://example.com/a/a/a",
            value: {
              type: "iri"
            }
          }]
        }
      }, {
        type: "component",
        key: "http://example.com/a/b",
        value: {
          type: "coproduct",
          options: [{
            type: "option",
            key: "http://example.com/a/b/a",
            value: {
              type: "unit"
            }
          }, {
            type: "option",
            key: "http://example.com/a/b/b",
            value: {
              type: "reference",
              value: 1
            }
          }]
        }
      }]
    }
  }, {
    type: "label",
    key: "http://example.com/b/",
    value: {
      type: "product",
      components: [{
        type: "component",
        key: "http://example.com/b/a",
        value: {
          type: "reference",
          value: 0
        }
      }, {
        type: "component",
        key: "http://example.com/b/b",
        value: {
          type: "iri"
        }
      }]
    }
  }];
  const T = [{
    type: "label",
    key: "http://example.com/0",
    value: {
      type: "product",
      components: [{
        type: "component",
        key: "http://example.com/0.0",
        value: {
          type: "product",
          components: [{
            type: "component",
            key: "http://example.com/0.0.0",
            value: {
              type: "iri"
            }
          }, {
            type: "component",
            key: "http://example.com/0.0.1",
            value: {
              type: "iri"
            }
          }]
        }
      }, {
        type: "component",
        key: "http://example.com/0.1",
        value: {
          type: "reference",
          value: 1
        }
      }]
    }
  }, {
    type: "label",
    key: "http://example.com/1",
    value: {
      type: "product",
      components: [{
        type: "component",
        key: "http://example.com/1.0",
        value: {
          type: "reference",
          value: 0
        }
      }, {
        type: "component",
        key: "http://example.com/1.1",
        value: {
          type: "iri"
        }
      }]
    }
  }];
  return [S, T];
}

function getMigrationMapping() {
  const paths = [[0, NaN], [1, NaN]];
  const morphisms = [{
    type: "tuple",
    componentKeys: ["http://example.com/a/a", "http://example.com/a/b"],
    morphisms: [{
      type: "tuple",
      componentKeys: ["http://example.com/a/a/a"],
      morphisms: [{
        type: "composition",
        object: {
          type: "product",
          components: [{
            type: "component",
            key: "http://example.com/0.0.0",
            value: {
              type: "iri"
            }
          }, {
            type: "component",
            key: "http://example.com/0.0.1",
            value: {
              type: "iri"
            }
          }]
        },
        morphisms: [{
          type: "projection",
          componentKeys: ["http://example.com/0.0", "http://example.com/0.1"],
          index: 0
        }, {
          type: "projection",
          componentKeys: ["http://example.com/0.0.0", "http://example.com/0.0.1"],
          index: 0
        }]
      }]
    }, {
      type: "composition",
      object: {
        type: "reference",
        value: 1
      },
      morphisms: [{
        type: "projection",
        componentKeys: ["http://example.com/0.0", "http://example.com/0.1"],
        index: 1
      }, {
        type: "composition",
        object: {
          type: "product",
          components: [{
            type: "component",
            key: "http://example.com/1.0",
            value: {
              type: "reference",
              value: 0
            }
          }, {
            type: "component",
            key: "http://example.com/1.1",
            value: {
              type: "iri"
            }
          }]
        },
        morphisms: [{
          type: "dereference"
        }, {
          type: "injection",
          optionKeys: ["http://example.com/a/b/a", "http://example.com/a/b/b"],
          index: 1
        }]
      }]
    }]
  }, {
    type: "tuple",
    componentKeys: ["http://example.com/b/a", "http://example.com/b/b"],
    morphisms: [{
      type: "composition",
      object: {
        type: "reference",
        value: 0
      },
      morphisms: [{
        type: "projection",
        componentKeys: ["http://example.com/1.0", "http://example.com/1.1"],
        index: 0
      }, {
        type: "dereference"
      }]
    }, {
      type: "projection",
      componentKeys: ["http://example.com/1.0", "http://example.com/1.1"],
      index: 1
    }]
  }];
  return [paths, morphisms];
}

function testDelta() {
  const [S, T] = getMigrationTestSchemas();
  const [m1, m2] = getMigrationMapping();
  const t = [[new _apg.default.Record(new _n.BlankNode((0, _utils.getId)()), ["http://example.com/0.0", "http://example.com/0.1"], [new _apg.default.Record(new _n.BlankNode((0, _utils.getId)()), ["http://example.com/0.0.0", "http://example.com/0.0.1"], [new _n.NamedNode("http://foo.com/neat"), new _n.NamedNode("http://foo.com/wow")]), new _apg.default.Pointer(0, 1)])], [new _apg.default.Record(new _n.BlankNode((0, _utils.getId)()), ["http://example.com/1.0", "http://example.com/1.1"], [new _apg.default.Pointer(0, 0), new _n.NamedNode("http://bar.org/fantastic")])]]; // for (const [path, morphism, { value }] of zip(m1, m2, S)) {
  // 	const type = APG.getType(T, path)
  // 	const image = fold(m1, value, T)
  // 	// console.log(JSON.stringify(image, null, "  "))
  // 	for (const aa of APG.getValues(t, path)) {
  // 		const result = map(morphism, aa, t)
  // 		console.log(
  // 			APG.validateValue(aa, type, T),
  // 			APG.validateValue(result, image, T)
  // 		)
  // 	}
  // 	// console.log(APG.validateMorphism(morphism, type, image, T))
  // }

  const s = (0, _mapping.delta)([m1, m2], S, T, t);
  console.log(s);
}

testDelta();