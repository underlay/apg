import t from "io-ts";
import N3 from "n3.ts";
declare type pattern = {
    pattern: string;
    flags: string;
};
declare type iri = {
    type: "iri";
};
declare type patternIri = iri & pattern;
declare type literal = {
    type: "literal";
    datatype: string;
};
declare type patternLiteral = literal & pattern;
export declare namespace APG {
    interface Schema {
        labels: Map<string, Label>;
        types: Map<string, Type>;
    }
    type Label = {
        type: "label";
        key: string;
        value: string | Reference;
    };
    type Type = Unit | Iri | Literal | Product | Coproduct;
    type Reference = {
        type: "reference";
        value: string;
    };
    type Unit = {
        type: "unit";
    };
    type Iri = iri | patternIri;
    type Literal = literal | patternLiteral;
    type Product = {
        type: "product";
        components: Map<string, Component>;
    };
    type Component = {
        type: "component";
        key: string;
        value: string | Reference;
    };
    type Coproduct = {
        type: "coproduct";
        options: Map<string, Option>;
    };
    type Option = {
        type: "option";
        value: string | Reference;
    };
    type Instance = Map<string, Set<Value>>;
    type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Tree;
    class Tree<C extends Value = Value> implements Iterable<[string, C]> {
        readonly node: N3.BlankNode;
        readonly children: Map<string, C>;
        constructor(node: N3.BlankNode, children: Iterable<[string, C]>);
        [Symbol.iterator](): IterableIterator<[string, C]>;
        keys(): Iterable<string>;
        values(): Iterable<C>;
        entries(): Iterable<[string, C]>;
        get termType(): "Tree";
        get size(): number;
        get(component: string): C | undefined;
    }
    type Morphism = Identity | Composition | Projection | Injection | Tuple | Case;
    type Identity = {
        type: "identity";
    };
    type Composition = {
        type: "composition";
        objects: [string, string, string];
        morphisms: [Morphism, Morphism];
    };
    type Projection = {
        type: "projection";
        component: string;
    };
    type Injection = {
        type: "injection";
        option: string;
    };
    type Tuple = {
        type: "tuple";
        morphisms: Map<string, Morphism>;
    };
    type Case = {
        type: "case";
        morphisms: Map<string, Morphism>;
    };
}
export declare function validateMorphism(morphism: APG.Morphism, source: string | APG.Reference, target: string | APG.Reference, schema: APG.Schema): boolean;
export declare const iriHasPattern: (expression: APG.Iri) => expression is patternIri;
export declare const literalHasPattern: (expression: APG.Literal) => expression is patternLiteral;
interface ID {
    readonly ID: unique symbol;
}
declare const iri: t.TypeC<{
    id: t.BrandC<t.StringC, ID>;
    type: t.LiteralC<"iri">;
}>;
declare const literal: t.UnionC<[t.TypeC<{
    id: t.BrandC<t.StringC, ID>;
    type: t.LiteralC<"literal">;
    datatype: t.StringC;
}>, t.TypeC<{
    id: t.BrandC<t.StringC, ID>;
    type: t.LiteralC<"literal">;
    datatype: t.StringC;
    pattern: t.StringC;
    flags: t.StringC;
}>]>;
export declare const codec: t.Type<({
    id: t.Branded<string, ID>;
    type: "literal";
    datatype: string;
} | {
    id: t.Branded<string, ID>;
    type: "literal";
    datatype: string;
    pattern: string;
    flags: string;
} | {
    id: t.Branded<string, ID>;
    type: "label";
    key: string;
    value: t.Branded<string, ID> | {
        type: "reference";
        value: t.Branded<string, ID>;
    };
} | {
    id: t.Branded<string, ID>;
    type: "unit";
} | {
    id: t.Branded<string, ID>;
    type: "iri";
} | {
    id: t.Branded<string, ID>;
    type: "product";
    components: {
        id: t.Branded<string, ID>;
        type: "component";
        key: string;
        value: t.Branded<string, ID> | {
            type: "reference";
            value: t.Branded<string, ID>;
        };
    }[];
} | {
    id: t.Branded<string, ID>;
    type: "coproduct";
    options: {
        id: t.Branded<string, ID>;
        type: "option";
        value: t.Branded<string, ID> | {
            type: "reference";
            value: t.Branded<string, ID>;
        };
    }[];
})[], Readonly<APG.Schema>, unknown>;
export {};
