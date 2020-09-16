import N3 from "n3.ts";
export declare type APG = Label[];
export declare type Label = {
    id: string;
    type: "label";
    key: string;
    value: Type;
};
export declare type Type = ReferenceType | NilType | IriType | LiteralType | ProductType | CoproductType;
declare type Pattern = {} | {
    pattern: string;
    flags: string;
};
export declare type ReferenceType = {
    id: string;
};
export declare type NilType = {
    type: "nil";
};
export declare type IriType = {
    type: "iri";
} & Pattern;
export declare type LiteralType = {
    type: "literal";
    datatype: string;
} & Pattern;
export declare type ProductType = {
    type: "product";
    components: Component[];
};
export declare type Component = {
    type: "component";
    key: string;
    value: Type;
};
export declare type CoproductType = {
    type: "coproduct";
    options: Option[];
};
export declare type Option = {
    type: "option";
    value: Type;
};
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
export declare const isReference: (expression: Type) => expression is ReferenceType;
export declare const iriHasPattern: (expression: IriType) => expression is {
    type: "iri";
    pattern: string;
    flags: string | null;
};
export declare const literalHasPattern: (expression: LiteralType) => expression is {
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
export {};
