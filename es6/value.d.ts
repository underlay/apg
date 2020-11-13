import APG from "./apg.js";
export declare function validateValue(value: APG.Value, type: APG.Type): boolean;
export declare function forValue(value: APG.Value): Generator<[APG.Value], void, undefined>;
