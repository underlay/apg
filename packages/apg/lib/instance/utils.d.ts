import * as Schema from "../schema/schema.js";
import * as Instance from "./instance.js";
export declare function validateInstance<S extends Record<string, Schema.Type>>(schema: Schema.Schema<S>, instance: Instance.Instance<S>): boolean;
export declare function validateValue<T extends Schema.Type>(type: T, value: Instance.Value): value is Instance.Value<T>;
export declare function forValues(schema: Schema.Schema, instance: Instance.Instance, key: string, path: string[]): Generator<Instance.Value, void, undefined>;
