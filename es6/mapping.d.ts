import APG from "./apg.js";
export declare function validateMapping(M: APG.Mapping, S: APG.Schema, T: APG.Schema): boolean;
export declare function fold(M: APG.Mapping, S: APG.Schema, T: APG.Schema, type: APG.Type): APG.Type;
export declare const mapExpressions: (expressions: readonly APG.Expression[], value: APG.Value, instance: APG.Instance, schema: APG.Schema) => APG.Value;
export declare function map(expression: APG.Expression, value: APG.Value, instance: APG.Instance, schema: APG.Schema): APG.Value;
export declare function delta(M: APG.Mapping, S: APG.Schema, T: APG.Schema, TI: APG.Instance): APG.Instance;
