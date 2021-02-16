import * as Schema from "./schema.js";
export declare function forTypes(schema: Schema.Schema): Generator<[Schema.Type, string, string[]], void, undefined>;
export declare function isTypeEqual(a: Schema.Type, b: Schema.Type): boolean;
export declare function isTypeAssignable(a: Schema.Type, b: Schema.Type): boolean;
export declare function unify(a: Schema.Type, b: Schema.Type): Schema.Type;
