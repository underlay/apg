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
    type Instance = Value[][];
    type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Record | Variant | Pointer;
    class Pointer {
        readonly index: number;
        constructor(index: number);
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
        readonly key: string;
        readonly value: Value;
        constructor(node: N3.BlankNode, key: string, value: Value);
        get termType(): "Variant";
    }
    type Expression = Identity | Initial | Terminal | Identifier | Constant | Dereference | Projection | Injection | Tuple | Match;
    type Identity = Readonly<{
        type: "identity";
    }>;
    type Initial = Readonly<{
        type: "initial";
    }>;
    type Terminal = Readonly<{
        type: "terminal";
    }>;
    type Identifier = Readonly<{
        type: "identifier";
        value: N3.NamedNode;
    }>;
    type Constant = Readonly<{
        type: "constant";
        value: N3.Literal;
    }>;
    type Dereference = Readonly<{
        type: "dereference";
        key: string;
    }>;
    type Projection = Readonly<{
        type: "projection";
        key: string;
    }>;
    type Injection = Readonly<{
        type: "injection";
        key: string;
        value: Expression[];
    }>;
    type Tuple = Readonly<{
        type: "tuple";
        slots: readonly Slot[];
    }>;
    type Slot = Readonly<{
        type: "slot";
        key: string;
        value: Expression[];
    }>;
    type Match = Readonly<{
        type: "match";
        cases: readonly Case[];
    }>;
    type Case = Readonly<{
        type: "case";
        key: string;
        value: Expression[];
    }>;
    type Map = Readonly<{
        type: "map";
        key: string;
        source: string;
        target: Path;
        value: readonly APG.Expression[];
    }>;
    type Path = readonly {
        readonly type: "component" | "option";
        readonly value: string;
    }[];
    type Mapping = Map[];
}
export default APG;
