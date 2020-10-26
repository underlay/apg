import t from "io-ts";
import * as N3 from "n3.ts";
declare namespace APG {
    type Schema = Label[];
    type Label = Readonly<{
        type: "label";
        key: string;
        value: Type;
    }>;
    type Type = Unit | Iri | Literal | Product | Coproduct | Reference;
    type Reference = Readonly<{
        type: "reference";
        value: number;
    }>;
    type Unit = Readonly<{
        type: "unit";
    }>;
    type Iri = Readonly<{
        type: "iri";
    }>;
    type Literal = Readonly<{
        type: "literal";
        datatype: string;
    }>;
    type Product = Readonly<{
        type: "product";
        components: Component[];
    }>;
    type Component = Readonly<{
        type: "component";
        key: string;
        value: Type;
    }>;
    type Coproduct = Readonly<{
        type: "coproduct";
        options: Option[];
    }>;
    type Option = Readonly<{
        type: "option";
        key: string;
        value: Type;
    }>;
    type Instance = Value[][];
    type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Record | Variant | Pointer;
    class Pointer {
        readonly index: number;
        constructor(index: number);
        get termType(): "Pointer";
    }
    class Record extends Array<Value> {
        readonly node: N3.BlankNode;
        readonly componentKeys: string[];
        constructor(node: N3.BlankNode, componentKeys: string[], values: Iterable<Value>);
        get termType(): "Record";
        get(key: string): Value;
    }
    class Variant {
        readonly node: N3.BlankNode;
        readonly optionKeys: string[];
        readonly index: number;
        readonly value: Value;
        constructor(node: N3.BlankNode, optionKeys: string[], index: number, value: Value);
        get termType(): "Variant";
        get key(): string;
    }
    function validateValue(value: Value, type: Type, schema: Schema): boolean;
    type Morphism = Identity | Composition | Projection | Injection | Tuple | Case | Constant;
    type Identity = Readonly<{
        type: "identity";
    }>;
    type Composition = Readonly<{
        type: "composition";
        object: APG.Type;
        morphisms: [Morphism, Morphism];
    }>;
    type Projection = Readonly<{
        type: "projection";
        index: number;
    }>;
    type Injection = Readonly<{
        type: "injection";
        index: number;
    }>;
    type Tuple = Readonly<{
        type: "tuple";
        morphisms: Morphism[];
    }>;
    type Case = Readonly<{
        type: "case";
        morphisms: Morphism[];
    }>;
    type Constant = Readonly<{
        type: "constant";
        value: N3.BlankNode | N3.NamedNode | N3.Literal;
    }>;
    function validateMorphism(morphism: APG.Morphism, source: APG.Type, target: APG.Type, schema: APG.Schema): boolean;
    const reference: t.Type<APG.Reference>;
    const unit: t.Type<APG.Unit>;
    const iri: t.Type<APG.Iri>;
    const literal: t.Type<APG.Literal>;
    const product: t.Type<APG.Product>;
    const coproduct: t.Type<APG.Coproduct>;
    const type: t.Type<Type>;
    const component: t.Type<APG.Component>;
    const option: t.Type<APG.Option>;
    const label: t.TypeC<{
        type: t.LiteralC<"label">;
        key: t.StringC;
        value: t.Type<Type, Type, unknown>;
    }>;
    const schema: t.Type<APG.Schema>;
}
export default APG;
