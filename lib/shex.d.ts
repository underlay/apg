/// <reference types="shexjs" />
import { Store, D, Subject } from "n3.ts";
import { FailureResult } from "@shexjs/validator";
import { Value, APG } from "./schema.js";
declare type Either<L, R> = {
    _tag: "Left";
    left: L;
} | {
    _tag: "Right";
    right: R;
};
export declare function parseSchemaString(input: string, schemaSchema: APG.Label[]): Either<FailureResult, APG.Label[]>;
export declare function parseSchema(store: Store, schemaSchema: APG.Label[]): Either<FailureResult, APG.Label[]>;
export declare function parse(store: Store, labels: APG.Label[]): Generator<[APG.Label, Generator<[Subject<D>, Either<FailureResult, Value>]>], void, undefined>;
export {};
