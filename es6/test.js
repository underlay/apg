import fs from "fs";
import { Store, DataFactory, rdf, xsd, Parse } from "n3.ts";
import canonize from "rdf-canonize";
import { parse } from "./parse.js";
import { parseSchemaString } from "./parseSchema.js";
import { serialize } from "./serialize.js";
import { encode } from "./binary.js";
import schemaSchema from "./bootstrap.js";
import { serializeSchemaString } from "./serializeSchema.js";
const context = JSON.parse(fs.readFileSync("context.jsonld", "utf-8"));
function getTestStore() {
    const rex = "http://underlay.org/ns/rex";
    const p = (base, id) => `${base}#${id}`;
    const subject = DataFactory.namedNode(p(rex, "subject")), object = DataFactory.namedNode(p(rex, "object")), lat = DataFactory.namedNode(p(rex, "lat")), long = DataFactory.namedNode(p(rex, "long"));
    const personType = DataFactory.namedNode("http://example.com/Person"), knowsType = DataFactory.namedNode("http://example.com/Person/knows"), nameType = DataFactory.namedNode("http://example.com/Person/name"), geoType = DataFactory.namedNode("http://example.com/Person/geo");
    const decimal = DataFactory.namedNode(xsd.decimal);
    const rdfType = DataFactory.namedNode(rdf.type);
    const pg = DataFactory.blankNode("person-geo"), g1 = DataFactory.blankNode("geo1"), g1o1 = DataFactory.blankNode("geo1option1"), g1o1o1 = DataFactory.blankNode("geo1option1option1"), g2 = DataFactory.namedNode("http://im-a-geo-coordinate.com"), pk = DataFactory.blankNode("person-knows"), p1 = DataFactory.blankNode("person1"), p2 = DataFactory.blankNode("person2"), 
    // p3 = DataFactory.blankNode("person3"),
    n1 = DataFactory.blankNode("person-name1"), n2 = DataFactory.blankNode("person-name2");
    const john = DataFactory.literal("John Doe"), jane = DataFactory.literal("Jane Doe");
    return new Store([
        DataFactory.quad(p1, rdfType, personType),
        DataFactory.quad(p2, rdfType, personType),
        // DataFactory.quad(p3, rdfType, personType),
        DataFactory.quad(n1, rdfType, nameType),
        DataFactory.quad(n1, subject, p1),
        DataFactory.quad(n1, object, john),
        DataFactory.quad(n2, rdfType, nameType),
        DataFactory.quad(n2, subject, p2),
        DataFactory.quad(n2, object, jane),
        DataFactory.quad(pk, rdfType, knowsType),
        DataFactory.quad(pk, subject, p1),
        DataFactory.quad(pk, object, p2),
        // DataFactory.quad(pk, object, pk),
        DataFactory.quad(pg, rdfType, geoType),
        DataFactory.quad(pg, subject, p1),
        // DataFactory.quad(pg, object, g2),
        DataFactory.quad(pg, object, g1),
        DataFactory.quad(pg, DataFactory.namedNode(p(rex, "self")), pg),
        // DataFactory.quad(g1, DataFactory.namedNode(p(rex, "geo-iri")), g2),
        DataFactory.quad(g1, DataFactory.namedNode(p(rex, "geo-cop")), g1o1),
        DataFactory.quad(g1o1, DataFactory.namedNode(p(rex, "geo-pro")), g1o1o1),
        DataFactory.quad(g1o1o1, lat, DataFactory.literal("20.32", decimal)),
        DataFactory.quad(g1o1o1, long, DataFactory.literal("99.222", decimal)),
    ]);
}
function testParseInstance(store, schema) {
    const result = parse(store, schema);
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
    const file = fs.readFileSync("test.schema.nq", "utf-8");
    const result = parseSchemaString(file);
    if (result._tag === "Left") {
        console.error(result.left);
        process.exit(1);
    }
    const store = getTestStore();
    testParseInstance(store, result.right);
}
function cunningFox() {
    const file = fs.readFileSync("test.schema.nq", "utf-8");
    const store = new Store(Parse(file));
    testParseInstance(store, schemaSchema);
}
function playfulDuck() {
    const file = fs.readFileSync("schema.schema.nq", "utf-8");
    const store = new Store(Parse(file));
    testParseInstance(store, schemaSchema);
}
function testParseSchema(name) {
    const file = fs.readFileSync(name, "utf-8");
    const result = parseSchemaString(file);
    if (result._tag === "Left") {
        console.error(`${name} did not parse`);
        console.error(result.left.errors);
    }
    else {
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
    const test1 = fs.readFileSync(testSchemaPath, "utf-8");
    const result = parseSchemaString(test1);
    if (result._tag === "Left") {
        console.error(result.left);
        process.exit(1);
    }
    const test2 = serializeSchemaString(result.right);
    // console.log(test1)
    // console.log("---")
    // console.log(test2)
    console.log("EQUAL", test1 === test2);
}
function outrageousLion() {
    const store = getTestStore();
    const file = fs.readFileSync("test.schema.nq", "utf-8");
    const schemaResult = parseSchemaString(file);
    if (schemaResult._tag === "Left") {
        console.error("test.schema.nq is invalid");
        console.error(schemaResult.left);
        process.exit(1);
    }
    else {
        const result = parse(store, schemaResult.right);
        if (result._tag === "Left") {
            console.error("test store did not validate");
            console.error(JSON.stringify(result.left.errors, null, "  "));
        }
        else {
            console.error("got instance", result.right);
            const output = encode(result.right);
            console.log(output);
        }
    }
}
function spookyTapir() {
    const input = fs.readFileSync("schema.schema.nq", "utf-8");
    const store = new Store(Parse(input));
    const instance = parse(store, schemaSchema);
    if (instance._tag === "Left") {
        console.error("test.schema.nq did not validate");
        console.error(JSON.stringify(instance.left.errors, null, "  "));
    }
    else {
        const output = encode(instance.right);
        console.log(output);
    }
}
function roundTripInstance(store, schemaPath) {
    const schemaFile = fs.readFileSync(schemaPath, "utf-8");
    const schemaResult = parseSchemaString(schemaFile);
    if (schemaResult._tag === "Left") {
        console.error(schemaResult.left);
        process.exit(1);
    }
    const schema = schemaResult.right;
    const result = parse(store, schema);
    if (result._tag === "Left") {
        console.error(JSON.stringify(result.left.errors, null, "  "));
        process.exit(1);
    }
    const instance = result.right;
    const nextDataset = [];
    for (const quad of serialize(instance, schema)) {
        nextDataset.push(quad.toJSON());
    }
    const nextDatasetString = canonize.canonizeSync(nextDataset, {
        algorithm: "URDNA2015",
    });
    const dataset = [];
    for (const quad of store) {
        dataset.push(quad.toJSON());
    }
    const datasetString = canonize.canonizeSync(dataset, {
        algorithm: "URDNA2015",
    });
    console.log("EQUAL", datasetString === nextDatasetString);
}
magnificentEagle();
// cunningFox()
// knowingOwl()
// forgivingDeer()
// playfulDuck()
roundTripSchema("test.schema.nq");
roundTripSchema("schema.schema.nq");
// outrageousLion()
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
//# sourceMappingURL=test.js.map