import * as N3 from "n3.ts";
import APG from "./apg.js";
export declare function serializeSchemaString(schema: APG.Schema): string;
export declare function serializeSchema(schema: APG.Schema): Generator<N3.Quad, void, undefined>;
