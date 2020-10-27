"use strict";

var _fs = _interopRequireDefault(require("fs"));

var _n = require("n3.ts");

var _rdfCanonize = _interopRequireDefault(require("rdf-canonize"));

var _parse = require("./parse.js");

var _parseSchema = require("./parseSchema.js");

var _serialize = require("./serialize.js");

var _binary = require("./binary.js");

var _bootstrap = _interopRequireDefault(require("./bootstrap.js"));

var _serializeSchema = require("./serializeSchema.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const context = JSON.parse(_fs.default.readFileSync("context.jsonld", "utf-8"));

function getTestStore() {
  const rex = "http://underlay.org/ns/rex";

  const p = (base, id) => `${base}#${id}`;

  const subject = _n.DataFactory.namedNode(p(rex, "subject")),
        object = _n.DataFactory.namedNode(p(rex, "object")),
        lat = _n.DataFactory.namedNode(p(rex, "lat")),
        long = _n.DataFactory.namedNode(p(rex, "long"));

  const personType = _n.DataFactory.namedNode("http://example.com/Person"),
        knowsType = _n.DataFactory.namedNode("http://example.com/Person/knows"),
        nameType = _n.DataFactory.namedNode("http://example.com/Person/name"),
        geoType = _n.DataFactory.namedNode("http://example.com/Person/geo");

  const decimal = _n.DataFactory.namedNode(_n.xsd.decimal);

  const rdfType = _n.DataFactory.namedNode(_n.rdf.type);

  const pg = _n.DataFactory.blankNode("person-geo"),
        g1 = _n.DataFactory.blankNode("geo1"),
        g1o1 = _n.DataFactory.blankNode("geo1option1"),
        g1o1o1 = _n.DataFactory.blankNode("geo1option1option1"),
        g2 = _n.DataFactory.namedNode("http://im-a-geo-coordinate.com"),
        pk = _n.DataFactory.blankNode("person-knows"),
        p1 = _n.DataFactory.blankNode("person1"),
        p2 = _n.DataFactory.blankNode("person2"),
        // p3 = DataFactory.blankNode("person3"),
  n1 = _n.DataFactory.blankNode("person-name1"),
        n2 = _n.DataFactory.blankNode("person-name2");

  const john = _n.DataFactory.literal("John Doe"),
        jane = _n.DataFactory.literal("Jane Doe");

  return new _n.Store([_n.DataFactory.quad(p1, rdfType, personType), _n.DataFactory.quad(p2, rdfType, personType), // DataFactory.quad(p3, rdfType, personType),
  _n.DataFactory.quad(n1, rdfType, nameType), _n.DataFactory.quad(n1, subject, p1), _n.DataFactory.quad(n1, object, john), _n.DataFactory.quad(n2, rdfType, nameType), _n.DataFactory.quad(n2, subject, p2), _n.DataFactory.quad(n2, object, jane), _n.DataFactory.quad(pk, rdfType, knowsType), _n.DataFactory.quad(pk, subject, p1), _n.DataFactory.quad(pk, object, p2), // DataFactory.quad(pk, object, pk),
  _n.DataFactory.quad(pg, rdfType, geoType), _n.DataFactory.quad(pg, subject, p1), // DataFactory.quad(pg, object, g2),
  _n.DataFactory.quad(pg, object, g1), _n.DataFactory.quad(pg, _n.DataFactory.namedNode(p(rex, "self")), pg), // DataFactory.quad(g1, DataFactory.namedNode(p(rex, "geo-iri")), g2),
  _n.DataFactory.quad(g1, _n.DataFactory.namedNode(p(rex, "geo-cop")), g1o1), _n.DataFactory.quad(g1o1, _n.DataFactory.namedNode(p(rex, "geo-pro")), g1o1o1), _n.DataFactory.quad(g1o1o1, lat, _n.DataFactory.literal("20.32", decimal)), _n.DataFactory.quad(g1o1o1, long, _n.DataFactory.literal("99.222", decimal))]);
}

function testParseInstance(store, schema) {
  const result = (0, _parse.parse)(store, schema);

  if (result._tag === "Left") {
    console.log(JSON.stringify(result.left.errors, null, "  "));
    process.exit(1);
  }

  for (const [i, values] of result.right.entries()) {
    for (const [j, value] of values.entries()) {
      console.log(i, j, value);
    }
  }
}

function magnificentEagle() {
  const file = _fs.default.readFileSync("test.schema.nq", "utf-8");

  const result = (0, _parseSchema.parseSchemaString)(file);

  if (result._tag === "Left") {
    console.error(result.left);
    process.exit(1);
  }

  const store = getTestStore();
  testParseInstance(store, result.right);
}

function cunningFox() {
  const file = _fs.default.readFileSync("test.schema.nq", "utf-8");

  const store = new _n.Store((0, _n.Parse)(file));
  testParseInstance(store, _bootstrap.default);
}

function playfulDuck() {
  const file = _fs.default.readFileSync("schema.schema.nq", "utf-8");

  const store = new _n.Store((0, _n.Parse)(file));
  testParseInstance(store, _bootstrap.default);
}

function testParseSchema(name) {
  const file = _fs.default.readFileSync(name, "utf-8");

  const result = (0, _parseSchema.parseSchemaString)(file);

  if (result._tag === "Left") {
    console.error(`${name} did not parse`);
    console.error(result.left.errors);
  } else {
    console.log(result.right);
  }
}

function knowingOwl() {
  testParseSchema("test.schema.nq");
}

function forgivingDeer() {
  testParseSchema("schema.schema.nq");
}

async function roundTripSchema(testSchemaPath) {
  const test1 = _fs.default.readFileSync(testSchemaPath, "utf-8");

  const result = (0, _parseSchema.parseSchemaString)(test1);

  if (result._tag === "Left") {
    console.error(result.left);
    process.exit(1);
  }

  const test2 = (0, _serializeSchema.serializeSchemaString)(result.right); // console.log(test1)
  // console.log("---")
  // console.log(test2)

  console.log("EQUAL", test1 === test2);
}

function outrageousLion() {
  const store = getTestStore();

  const file = _fs.default.readFileSync("test.schema.nq", "utf-8");

  const schemaResult = (0, _parseSchema.parseSchemaString)(file);

  if (schemaResult._tag === "Left") {
    console.error("test.schema.nq is invalid");
    console.error(schemaResult.left);
    process.exit(1);
  } else {
    const result = (0, _parse.parse)(store, schemaResult.right);

    if (result._tag === "Left") {
      console.error("test store did not validate");
      console.error(JSON.stringify(result.left.errors, null, "  "));
    } else {
      console.error("got instance", result.right);
      const output = (0, _binary.encode)(result.right);
      console.log(output);
    }
  }
}

function spookyTapir() {
  const input = _fs.default.readFileSync("schema.schema.nq", "utf-8");

  const store = new _n.Store((0, _n.Parse)(input));
  const instance = (0, _parse.parse)(store, _bootstrap.default);

  if (instance._tag === "Left") {
    console.error("test.schema.nq did not validate");
    console.error(JSON.stringify(instance.left.errors, null, "  "));
  } else {
    const output = (0, _binary.encode)(instance.right);
    console.log(output);
  }
}

function roundTripInstance(store, schemaPath) {
  const schemaFile = _fs.default.readFileSync(schemaPath, "utf-8");

  const schemaResult = (0, _parseSchema.parseSchemaString)(schemaFile);

  if (schemaResult._tag === "Left") {
    console.error(schemaResult.left);
    process.exit(1);
  }

  const schema = schemaResult.right;
  const result = (0, _parse.parse)(store, schema);

  if (result._tag === "Left") {
    console.error(JSON.stringify(result.left.errors, null, "  "));
    process.exit(1);
  }

  const instance = result.right;
  const nextDataset = [];

  for (const quad of (0, _serialize.serialize)(instance, schema)) {
    nextDataset.push(quad.toJSON());
  }

  const nextDatasetString = _rdfCanonize.default.canonizeSync(nextDataset, {
    algorithm: "URDNA2015"
  });

  const dataset = [];

  for (const quad of store) {
    dataset.push(quad.toJSON());
  }

  const datasetString = _rdfCanonize.default.canonizeSync(dataset, {
    algorithm: "URDNA2015"
  });

  console.log("EQUAL", datasetString === nextDatasetString);
}

magnificentEagle(); // cunningFox()
// knowingOwl()
// forgivingDeer()
// playfulDuck()

roundTripSchema("test.schema.nq");
roundTripSchema("schema.schema.nq"); // outrageousLion()
// spookyTapir()
// roundTripInstance(getTestStore(), "test.schema.nq")
// roundTripInstance(
// 	new Store(Parse(fs.readFileSync("test.schema.nq", "utf-8"))),
// 	"schema.schema.nq"
// )
// roundTripInstance(
// 	new Store(Parse(fs.readFileSync("schema.schema.nq", "utf-8"))),
// 	"schema.schema.nq"
// )
// const file = fs.readFileSync("test.output.schema.nq", "utf-8")
// const store = new Store(Parse(file))
// testParseInstance(store, schemaSchema)