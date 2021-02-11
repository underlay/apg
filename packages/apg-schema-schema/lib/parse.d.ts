import { Schema, Instance } from "@underlay/apg";
import { SchemaSchema } from "./schema.js";
export declare function toSchema(instance: Instance.Instance<SchemaSchema>): Schema.Schema;
export declare function fromSchema<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>): Instance.Instance<SchemaSchema>;
