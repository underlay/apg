import APG from "./apg.js";
export declare function getType(schema: APG.Schema, source: string, target: APG.Path): APG.Type;
export declare function getValues(schema: APG.Schema, instance: APG.Instance, source: string, target: APG.Path): Generator<APG.Value, void, undefined>;
