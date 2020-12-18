import APG from "./apg.js";
export declare function validateInstance<S extends {
    [key in string]: APG.Type;
}>(schema: APG.Schema<S>, instance: APG.Instance<S>): boolean;
export declare function validateValue<T extends APG.Type, V extends APG.Value<T>>(type: T, value: V): boolean;
export declare function forValue(value: APG.Value, stack?: APG.Value[]): Generator<[APG.Value, APG.Value[]], void, undefined>;
