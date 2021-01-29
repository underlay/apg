import * as Mapping from "./mapping.js";
import * as Schema from "../schema/schema.js";
import * as Instance from "../instance/instance.js";
export declare function validateMapping(M: Mapping.Mapping, S: Schema.Schema, T: Schema.Schema): boolean;
export declare function fold(M: Mapping.Mapping, S: Schema.Schema, T: Schema.Schema, type: Schema.Type): Schema.Type;
export declare const mapExpressions: (expressions: readonly Mapping.Expression[], value: Instance.Value, instance: Instance.Instance, schema: Schema.Schema) => Instance.Uri<string> | Instance.Reference | Instance.Literal<string> | Instance.Product<{
    [x: string]: Schema.Type;
}> | Instance.Coproduct<{
    [x: string]: Schema.Type;
}, string>;
export declare function map(expression: Mapping.Expression, value: Instance.Value, instance: Instance.Instance, schema: Schema.Schema): Instance.Value;
export declare function delta(M: Mapping.Mapping, S: Schema.Schema, T: Schema.Schema, TI: Instance.Instance): Instance.Instance;
