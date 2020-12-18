import APG from "./apg.js";
export declare const applyExpressions: (S: APG.Schema, expressions: readonly APG.Expression[], source: APG.Type) => APG.Type;
export declare function apply(S: APG.Schema, expression: APG.Expression, source: APG.Type): APG.Type;
export declare function validateExpressions(S: APG.Schema, expressions: readonly APG.Expression[], source: APG.Type, target: APG.Type): boolean;
