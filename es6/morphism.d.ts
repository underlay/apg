import APG from "./apg.js";
export declare function apply(schema: APG.Schema, source: APG.Type, morphism: APG.Morphism): APG.Type;
export declare function validateMorphism(morphism: APG.Morphism, source: APG.Type, target: APG.Type, schema: APG.Schema): boolean;
