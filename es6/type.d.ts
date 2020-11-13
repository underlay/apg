import APG from "./apg.js";
export declare function forType(type: APG.Type, stack?: APG.Type[]): Generator<[APG.Type, APG.Type[]], void, undefined>;
export declare function typeEqual(a: APG.Type, b: APG.Type): boolean;
