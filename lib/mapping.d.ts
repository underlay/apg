import APG from "./apg.js";
export declare type Mapping = Readonly<{
    source: APG.Schema;
    target: APG.Schema;
    m1: APG.Type[];
    m2: APG.Morphism[];
}>;
export declare function validateMapping(mapping: Mapping): boolean;
