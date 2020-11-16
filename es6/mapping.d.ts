import APG from "./apg.js";
export declare function validateMapping([m1, m2]: APG.Mapping, source: APG.Schema, target: APG.Schema): boolean;
export declare function fold(m1: APG.Path[], type: APG.Type, target: APG.Schema): APG.Type;
export declare function map(morphism: APG.Morphism, value: APG.Value, instance: APG.Instance): APG.Value;
export declare function delta(M: APG.Mapping, S: APG.Schema, T: APG.Schema, TI: APG.Instance): APG.Instance;
