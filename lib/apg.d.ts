import t from "io-ts";
import N3 from "n3.ts";
declare namespace APG {
    export type Schema = Readonly<{
        labels: Map<string, Label>;
        types: Map<string, Type>;
    }>;
    export type Label = Readonly<{
        type: "label";
        key: string;
        value: string | Reference;
    }>;
    export type Type = Unit | Iri | Literal | Product | Coproduct;
    export type Reference = Readonly<{
        type: "reference";
        value: string;
    }>;
    export type Unit = Readonly<{
        type: "unit";
    }>;
    export type Iri = Readonly<{
        type: "iri";
    }>;
    export type Literal = Readonly<{
        type: "literal";
        datatype: string;
    }>;
    export type Product = Readonly<{
        type: "product";
        components: Map<string, Component>;
    }>;
    export type Component = Readonly<{
        type: "component";
        key: string;
        value: string | Reference;
    }>;
    export type Coproduct = Readonly<{
        type: "coproduct";
        options: Map<string, Option>;
    }>;
    export type Option = Readonly<{
        type: "option";
        key: string;
        value: string | Reference;
    }>;
    export type Instance = Map<string, Set<Value>>;
    export type UnitValue = N3.BlankNode;
    export type IriValue = Readonly<{
        type: "iri";
        value: N3.NamedNode;
    }>;
    export type LiteralValue = Readonly<{
        type: "literal";
        value: N3.Literal;
    }>;
    export class ProductValue<C extends Value = Value> implements Iterable<[string, C]> {
        readonly node: N3.BlankNode;
        readonly children: Map<string, C>;
        constructor(node: N3.BlankNode, children?: Iterable<[string, C]>);
        [Symbol.iterator](): IterableIterator<[string, C]>;
        keys(): Iterable<string>;
        values(): Iterable<C>;
        entries(): Iterable<[string, C]>;
        get termType(): "Product";
        get size(): number;
        get(component: string): C | undefined;
    }
    export class CoproductValue<O extends Value = Value> {
        readonly node: N3.BlankNode;
        readonly option: string;
        value: O;
        constructor(node: N3.BlankNode, option: string, value: O);
        get termType(): "Coproduct";
        set(value: O): void;
    }
    export type Value = N3.BlankNode | N3.NamedNode | N3.Literal | ProductValue | CoproductValue;
    export type Morphism = Identity | Composition | Projection | Injection | Tuple | Case;
    export type Identity = Readonly<{
        type: "identity";
    }>;
    export type Composition = Readonly<{
        type: "composition";
        objects: [string, string, string];
        morphisms: [Morphism, Morphism];
    }>;
    export type Projection = Readonly<{
        type: "projection";
        component: string;
    }>;
    export type Injection = Readonly<{
        type: "injection";
        option: string;
    }>;
    export type Tuple = Readonly<{
        type: "tuple";
        morphisms: Map<string, Morphism>;
    }>;
    export type Case = Readonly<{
        type: "case";
        morphisms: Map<string, Morphism>;
    }>;
    export const toId: (id: string) => t.Branded<string, ID>;
    export const toValue: (id: string | Readonly<{
        type: "reference";
        value: string;
    }>, schema: Readonly<{
        labels: Map<string, Readonly<{
            type: "label";
            key: string;
            value: string | Readonly<{
                type: "reference";
                value: string;
            }>;
        }>>;
        types: Map<string, Type>;
    }>) => {
        unit: t.Branded<string, ID>;
    } | {
        iri: t.Branded<string, ID>;
    } | {
        literal: t.Branded<string, ID>;
    } | {
        product: t.Branded<string, ID>;
    } | {
        coproduct: t.Branded<string, ID>;
    } | {
        reference: {
            type: "reference";
            value: t.Branded<string, ID>;
        };
    };
    export function toJSON(schema: Schema): t.TypeOf<typeof codec>;
    export function validateMorphism(morphism: APG.Morphism, source: string | APG.Reference, target: string | APG.Reference, schema: APG.Schema): boolean;
    interface ID {
        readonly ID: unique symbol;
    }
    export const codec: t.Type<({
        id: t.Branded<string, ID>;
        type: "label";
        key: string;
        value: {
            unit: t.Branded<string, ID>;
        } | {
            iri: t.Branded<string, ID>;
        } | {
            literal: t.Branded<string, ID>;
        } | {
            product: t.Branded<string, ID>;
        } | {
            coproduct: t.Branded<string, ID>;
        } | {
            reference: {
                type: "reference";
                value: t.Branded<string, ID>;
            };
        };
    } | {
        id: t.Branded<string, ID>;
        type: "unit";
    } | {
        id: t.Branded<string, ID>;
        type: "iri";
    } | {
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
        type: "product";
        components: {
            id: t.Branded<string, ID>;
            type: "component";
            key: string;
            value: {
                unit: t.Branded<string, ID>;
            } | {
                iri: t.Branded<string, ID>;
            } | {
                literal: t.Branded<string, ID>;
            } | {
                product: t.Branded<string, ID>;
            } | {
                coproduct: t.Branded<string, ID>;
            } | {
                reference: {
                    type: "reference";
                    value: t.Branded<string, ID>;
                };
            };
        }[];
    } | {
        id: t.Branded<string, ID>;
        type: "coproduct";
        options: {
            id: t.Branded<string, ID>;
            type: "option";
            key: string;
            value: {
                unit: t.Branded<string, ID>;
            } | {
                iri: t.Branded<string, ID>;
            } | {
                literal: t.Branded<string, ID>;
            } | {
                product: t.Branded<string, ID>;
            } | {
                coproduct: t.Branded<string, ID>;
            } | {
                reference: {
                    type: "reference";
                    value: t.Branded<string, ID>;
                };
            };
        }[];
    })[], Readonly<{
        labels: Map<string, Readonly<{
            type: "label";
            key: string;
            value: string | Readonly<{
                type: "reference";
                value: string;
            }>;
        }>>;
        types: Map<string, Type>;
    }>, unknown>;
    export {};
}
export default APG;
