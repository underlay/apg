import * as Schema from "./schema.js";
export declare function forType(type: Schema.Type, stack?: Schema.Type[]): Generator<[Schema.Type, Schema.Type[]], void, undefined>;
export declare function isTypeEqual(a: Schema.Type, b: Schema.Type): boolean;
export declare function isTypeAssignable(a: Schema.Type, b: Schema.Type): boolean;
export declare function unify(a: Schema.Type, b: Schema.Type): Schema.Type;
