import { Schema } from "../schema/index.js";
import * as Mapping from "./mapping.js";
export declare const applyExpressions: (S: Schema.Schema, expressions: readonly Mapping.Expression[], source: Schema.Type) => Schema.Type;
export declare function apply(S: Schema.Schema, expression: Mapping.Expression, source: Schema.Type): Schema.Type;
export declare function validateExpressions(S: Schema.Schema, expressions: readonly Mapping.Expression[], source: Schema.Type, target: Schema.Type): boolean;
