import * as Mapping from "./mapping.js";
import * as Schema from "../schema/schema.js";
export declare function validateMapping(M: Mapping.Mapping, S: Schema.Schema, T: Schema.Schema): boolean;
export declare function fold(M: Mapping.Mapping, S: Schema.Schema, T: Schema.Schema, type: Schema.Type): Schema.Type;
