#!/usr/bin/env node
import { readFileSync } from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { decode } from "@underlay/apg-format-binary";
import schemaSchema, { toSchema } from "@underlay/apg-schema-schema";
const mapValues = (value) => value.toJSON();
const mapEntry = ([key, values]) => [key, values.map(mapValues)];
yargs(hideBin(process.argv))
    .usage("Usage: $0 <command> [options]")
    .command("cat", "Print a JSON representation of a schema or instance", (yargs) => yargs
    .option("schema", {
    alias: "s",
    type: "string",
    desc: "Parse the instance as a schema",
    demandOption: true,
})
    .option("instance", {
    alias: "i",
    type: "string",
    desc: "Parse the instance as a schema",
})
    .demandCommand(0, 0), (args) => {
    const file = readFileSync(args.schema);
    const instance = decode(schemaSchema, file);
    const schema = toSchema(instance);
    if (args.instance === undefined) {
        process.stdout.write(JSON.stringify(schema));
    }
    else {
        const file = readFileSync(args.instance);
        const instance = decode(schema, file);
        const entries = Object.entries(instance).map(mapEntry);
        process.stdout.write(JSON.stringify(Object.fromEntries(entries)));
    }
})
    .demandCommand(1, 1)
    .help().argv;
