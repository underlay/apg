/// <reference types="shexjs" />
import { Store } from "n3.ts";
import { Either } from "fp-ts/Either";
import { FailureResult } from "@shexjs/validator";
import { APG } from "./apg.js";
export declare const ns: {
    label: string;
    reference: string;
    unit: string;
    product: string;
    coproduct: string;
    component: string;
    option: string;
    source: string;
    key: string;
    value: string;
    iri: string;
    literal: string;
    datatype: string;
    pattern: string;
    flags: string;
};
export declare function parseSchemaString(input: string, schemaSchema: APG.Schema): Either<FailureResult, APG.Schema>;
export declare function parseSchema(store: Store, schemaSchema: APG.Schema): Either<FailureResult, APG.Schema>;
