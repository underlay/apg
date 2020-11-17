import APG from "./apg.js";
export declare function validateValue(type: APG.Type, value: APG.Value): boolean;
export declare function forValue(value: APG.Value): Generator<[APG.Value], void, undefined>;
