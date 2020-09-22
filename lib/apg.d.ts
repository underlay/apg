import N3 from "n3.ts";
declare type pattern = {
    pattern: string;
    flags: string;
};
declare type iri = {
    id: string;
    type: "iri";
};
declare type patternIri = iri & pattern;
declare type literal = {
    id: string;
    type: "literal";
    datatype: string;
};
declare type patternLiteral = literal & pattern;
export declare namespace APG {
    type Schema = Map<string, Type>;
    type Instance = Map<string, Value[]>;
    type Type = Label | Unit | Iri | Literal | Product | Coproduct;
    type Label = {
        id: string;
        type: "label";
        key: string;
        value: string;
    };
    type Unit = {
        id: string;
        type: "unit";
    };
    type Iri = iri | patternIri;
    type Literal = literal | patternLiteral;
    type Product = {
        id: string;
        type: "product";
        components: Component[];
    };
    type Component = {
        id: string;
        type: "component";
        key: string;
        value: string;
    };
    type Coproduct = {
        id: string;
        type: "coproduct";
        options: Option[];
    };
    type Option = {
        id: string;
        type: "option";
        value: string;
    };
    type LabelValue = {
        id: string;
        type: "label";
        value: Value;
    };
    type UnitValue = {
        id: string;
        type: "unit";
        node: N3.BlankNode;
    };
    type IriValue = {
        id: string;
        type: "iri";
        node: N3.NamedNode;
    };
    type LiteralValue = {
        id: string;
        type: "literal";
        node: N3.Literal;
    };
    type ProductValue = {
        id: string;
        type: "product";
        node: N3.BlankNode;
        components: Value[];
    };
    type CoproductValue = {
        id: string;
        type: "coproduct";
        value: Value;
    };
    type Value = LabelValue | UnitValue | IriValue | LiteralValue | ProductValue | CoproductValue;
}
export declare const iriHasPattern: (expression: APG.Iri) => expression is patternIri;
export declare const literalHasPattern: (expression: APG.Literal) => expression is patternLiteral;
export declare const context: {
    id: string;
    type: string;
    "@vocab": string;
    key: {
        "@type": string;
    };
    value: {
        "@type": string;
    };
    datatype: {
        "@type": string;
    };
    options: {
        "@reverse": string;
    };
    components: {
        "@reverse": string;
    };
};
export {};
