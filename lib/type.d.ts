import * as APG from "./apg.js";
export declare function forType(type: APG.Type, stack?: APG.Type[]): Generator<[APG.Type, APG.Type[]], void, undefined>;
export declare function isTypeEqual(a: APG.Type, b: APG.Type): boolean;
export declare function isTypeAssignable(a: APG.Type, b: APG.Type): boolean;
export declare function unify(a: APG.Type, b: APG.Type): APG.Type;
