import * as Schema from "../schema/schema.js";
import * as Instance from "./instance.js";
export declare function validateInstance<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>, instance: Instance.Instance<S>): boolean;
export declare function validateValue<T extends Schema.Type, V extends Instance.Value<T>>(type: T, value: V): boolean;
export declare function forValue(value: Instance.Value, stack?: Instance.Value[]): Generator<[Instance.Value, Instance.Value[]], void, undefined>;
