import { APG } from "../../index.js";
import { SchemaSchema } from "./index.js";
export declare function toSchema(instance: APG.Instance<SchemaSchema>): APG.Schema;
export declare function fromSchema<S extends {
    [key in string]: APG.Type;
}>(schema: APG.Schema<S>): APG.Instance<SchemaSchema>;
