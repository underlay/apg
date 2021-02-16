import * as Mapping from "./mapping.js";
import * as Schema from "../schema/schema.js";
import * as Instance from "../instance/instance.js";
export declare const mapExpressions: ({ S, SI }: {
    S: Schema.Schema;
    SI: Instance.Instance;
}, expressions: readonly Mapping.Expression[], type: Schema.Type, value: Instance.Value) => [Schema.Type, Instance.Value];
export declare function map({ S, SI }: {
    S: Schema.Schema;
    SI: Instance.Instance;
}, expression: Mapping.Expression, type: Schema.Type, value: Instance.Value): [Schema.Type, Instance.Value];
