import N3 from "n3.ts";
export declare namespace APG {
    export type Schema = Label[];
    export type Label = {
        id: string;
        type: "label";
        key: string;
        value: Type;
    };
    export type Type = Reference | Unit | Iri | Literal | Product | Coproduct;
    type Pattern = {} | {
        pattern: string;
        flags: string;
    };
    export type Reference = {
        id: string;
    };
    export type Unit = {
        type: "unit";
    };
    export type Iri = {
        type: "iri";
    } & Pattern;
    export type Literal = {
        type: "literal";
        datatype: string;
    } & Pattern;
    export type Product = {
        type: "product";
        components: Component[];
    };
    export type Component = {
        type: "component";
        key: string;
        value: Type;
    };
    export type Coproduct = {
        type: "coproduct";
        options: Option[];
    };
    export type Option = {
        type: "option";
        value: Type;
    };
    export {};
}
export declare const context: {
    id: string;
    type: string;
    "@vocab": string;
    key: {
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
export declare const isReference: (expression: APG.Type) => expression is APG.Reference;
export declare const iriHasPattern: (expression: APG.Iri) => expression is {
    type: "iri";
    pattern: string;
    flags: string | null;
};
export declare const literalHasPattern: (expression: APG.Literal) => expression is {
    type: "literal";
    datatype: string;
    pattern: string;
    flags: string | null;
};
export declare class Tree {
    readonly node: N3.BlankNode;
    private readonly children;
    constructor(node: N3.BlankNode, children: Iterable<[string, Value]>);
    get termType(): string;
    get value(): string;
    get size(): number;
    [Symbol.iterator](): IterableIterator<[string, Value]>;
    get(node: string): N3.Literal | N3.BlankNode | Tree | N3.NamedNode<string> | undefined;
}
export declare type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Tree;
