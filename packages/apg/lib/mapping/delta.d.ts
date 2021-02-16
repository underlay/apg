import * as Mapping from "./mapping.js";
import * as Schema from "../schema/schema.js";
import * as Instance from "../instance/instance.js";
export declare function delta(M: Mapping.Mapping, S: Schema.Schema, T: Schema.Schema, TI: Instance.Instance): Instance.Instance;
