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
        components: readonly Component[];
    }>;
    type Component = Readonly<{
        type: "component";
        key: string;
        value: Type;
    }>;
    type Coproduct = Readonly<{
        type: "coproduct";
        options: readonly Option[];
    }>;
    type Option = Readonly<{
        type: "option";
        key: string;
        value: Type;
    }>;
    type Path = [number, typeof NaN, ...number[]];
    type Instance = Value[][];
    type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Record | Variant | Pointer;
    class Pointer {
        readonly index: number;
        readonly label: number;
        constructor(index: number, label: number);
        get termType(): "Pointer";
    }
    class Record extends Array<Value> {
        readonly node: N3.BlankNode;
        readonly componentKeys: readonly string[];
        constructor(node: N3.BlankNode, componentKeys: readonly string[], values: Iterable<Value>);
        map<T>(f: (value: Value, index: number, record: Record) => T): T[];
        get termType(): "Record";
        get(key: string): Value;
    }
    class Variant {
        readonly node: N3.BlankNode;
        readonly optionKeys: readonly string[];
        readonly index: number;
        readonly value: Value;
        constructor(node: N3.BlankNode, optionKeys: readonly string[], index: number, value: Value);
        get termType(): "Variant";
        get key(): string;
    }
    type Morphism = Identity | Dereference | Composition | Projection | Injection | Tuple | Case | Constant | Terminal | Initial;
    type Identity = Readonly<{
        type: "identity";
    }>;
    type Dereference = Readonly<{
        type: "dereference";
    }>;
    type Composition = Readonly<{
        type: "composition";
        morphisms: readonly Morphism[];
    }>;
    type Projection = Readonly<{
        type: "projection";
        index: number;
    }>;
    type Injection = Readonly<{
        type: "injection";
        index: number;
        options: readonly APG.Option[];
    }>;
    type Tuple = Readonly<{
        type: "tuple";
        morphisms: readonly Morphism[];
        keys: readonly string[];
    }>;
    type Case = Readonly<{
        type: "case";
        morphisms: readonly Morphism[];
        keys: readonly string[];
    }>;
    type Terminal = Readonly<{
        type: "terminal";
    }>;
    type Initial = Readonly<{
        type: "initial";
    }>;
    type Constant = Readonly<{
        type: "constant";
        value: N3.NamedNode | N3.Literal;
    }>;
    type Mapping = readonly [readonly APG.Path[], readonly APG.Morphism[]];
}
export default APG;
