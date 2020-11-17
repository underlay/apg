import APG from "./apg.js";
export declare function getType(schema: APG.Schema, [label, nil, ...path]: APG.Path): APG.Type;
export declare function getValues(schema: APG.Schema, instance: APG.Instance, [label, nil, ...path]: APG.Path): Generator<APG.Value, void, undefined>;
