/// <reference types="shexjs" />
import { Store, D, Subject } from "n3.ts";
declare type Either<L, R> = {
    _tag: "Left";
    left: L;
} | {
    _tag: "Right";
    right: R;
};
import ShExParser from "@shexjs/parser";
import { FailureResult } from "@shexjs/validator";
import { Label, Value } from "./schema.js";
import { LabelShape } from "./reference.js";
export declare function makeShExSchema(labels: Label[]): [ShapeMap, ShExParser.Schema];
declare type ShapeMap = Map<string, LabelShape>;
export declare function parseSchemaString(input: string, schemaSchema: Label[]): Label[];
export declare function parseSchema(store: Store, schemaSchema: Label[]): Label[];
export declare function parse(store: Store, labels: Label[]): Generator<[Label, Generator<[Subject<D>, Either<FailureResult, Value>]>], void, undefined>;
export {};
