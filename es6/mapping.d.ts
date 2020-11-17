import APG from "./apg.js";
import { ID } from "./utils.js";
export declare function validateMapping([m1, m2]: APG.Mapping, source: APG.Schema, target: APG.Schema): boolean;
export declare function fold(m1: readonly APG.Path[], type: APG.Type, target: APG.Schema): APG.Type;
export declare function map(morphism: APG.Morphism, value: APG.Value, instance: APG.Instance, id: ID): APG.Value;
export declare function delta(M: APG.Mapping, S: APG.Schema, T: APG.Schema, TI: APG.Instance): APG.Instance;
