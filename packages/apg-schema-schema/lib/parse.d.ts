import { Schema, Instance } from "@underlay/apg";
import { SchemaSchema } from "./schema.js";
export declare function toSchema(instance: Instance.Instance<SchemaSchema>): Schema.Schema;
export declare function fromSchema(schema: Schema.Schema): Instance.Instance<SchemaSchema>;
