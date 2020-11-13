import APG from "./apg.js";
export declare type Mapping = Readonly<[APG.Path[], APG.Morphism[]]>;
export declare function validateMapping([m1, m2]: Mapping, source: APG.Schema, target: APG.Schema): boolean;
export declare function fold(m1: APG.Path[], type: APG.Type, target: APG.Schema): APG.Type;
export declare function map(morphism: APG.Morphism, value: APG.Value, instance: APG.Instance): APG.Value;
export declare function delta(mapping: Mapping, source: APG.Schema, target: APG.Schema, instance: APG.Instance): APG.Instance;
