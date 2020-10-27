/// <reference types="shexjs" />
import * as N3 from "n3.ts";
import { Either } from "fp-ts/Either";
import { FailureResult } from "@shexjs/validator";
import APG from "./apg.js";
export declare function parseSchemaString(input: string): Either<FailureResult, APG.Schema>;
export declare function parseSchema(store: N3.Store): Either<FailureResult, APG.Schema>;
