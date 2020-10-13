import t from "io-ts";
import * as N3 from "n3.ts";
declare namespace APG {
    export type Schema = Label[];
    export type Label = Readonly<{
        type: "label";
        key: string;
        value: Type;
    }>;
    export type Type = Unit | Iri | Literal | Product | Coproduct | Reference;
    export type Reference = Readonly<{
        type: "reference";
        value: number;
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
        components: Component[];
    }>;
    export type Component = Readonly<{
        type: "component";
        key: string;
        value: Type;
    }>;
    export type Coproduct = Readonly<{
        type: "coproduct";
        options: Option[];
    }>;
    export type Option = Readonly<{
        type: "option";
        key: string;
        value: Type;
    }>;
    export type Instance = Value[][];
    export type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Record | Variant | Pointer;
    export class Pointer {
        readonly index: number;
        constructor(index: number);
        get termType(): "Pointer";
    }
    export class Record extends Array<Value> {
        readonly node: N3.BlankNode;
        readonly componentKeys: string[];
        constructor(node: N3.BlankNode, componentKeys: string[], values: Iterable<Value>);
        get termType(): "Record";
        get(key: string): Value;
    }
    export class Variant {
        readonly node: N3.BlankNode;
        readonly optionKeys: string[];
        readonly index: number;
        readonly value: Value;
        constructor(node: N3.BlankNode, optionKeys: string[], index: number, value: Value);
        get termType(): "Variant";
        get key(): string;
    }
    export type Morphism = Identity | Composition | Projection | Injection | Tuple | Case | Constant;
    export type Identity = Readonly<{
        type: "identity";
    }>;
    export type Composition = Readonly<{
        type: "composition";
        object: APG.Type;
        morphisms: [Morphism, Morphism];
    }>;
    export type Projection = Readonly<{
        type: "projection";
        index: number;
    }>;
    export type Injection = Readonly<{
        type: "injection";
        index: number;
    }>;
    export type Tuple = Readonly<{
        type: "tuple";
        morphisms: Morphism[];
    }>;
    export type Case = Readonly<{
        type: "case";
        morphisms: Morphism[];
    }>;
    export type Constant = Readonly<{
        type: "constant";
        value: N3.BlankNode | N3.NamedNode | N3.Literal;
    }>;
    export function validateValue(value: Value, type: Type, schema: Schema): boolean;
    export function validateMorphism(morphism: APG.Morphism, source: APG.Type, target: APG.Type, schema: APG.Schema): boolean;
    export const toId: (id: string) => t.Branded<string, ID>;
    export function toJSON(schema: Schema): t.TypeOf<typeof codec>;
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
    })[], Schema, unknown>;
    export {};
}
export default APG;
