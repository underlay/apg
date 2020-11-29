import * as N3 from "n3.ts";
declare namespace APG {
    type Schema = Readonly<{
        [key: string]: Type;
    }>;
    type Type = Unit | Uri | Literal | Product | Coproduct | Reference;
    type Reference = Readonly<{
        type: "reference";
        value: string;
    }>;
    type Unit = Readonly<{
        type: "unit";
    }>;
    type Uri = Readonly<{
        type: "uri";
    }>;
    type Literal = Readonly<{
        type: "literal";
        datatype: string;
    }>;
    type Product = Readonly<{
        type: "product";
        components: Readonly<{
            [key: string]: Type;
        }>;
    }>;
    type Coproduct = Readonly<{
        type: "coproduct";
        options: Readonly<{
            [key: string]: Type;
        }>;
    }>;
    type Instance = Readonly<{
        [key: string]: Value[];
    }>;
    type Value = N3.BlankNode | N3.NamedNode | N3.Literal | Record | Variant | Pointer;
    class Pointer {
        readonly index: number;
        constructor(index: number);
        get termType(): "Pointer";
    }
    class Record extends Array<Value> {
        readonly components: readonly string[];
        get termType(): "Record";
        constructor(components: readonly string[], values: Iterable<Value>);
        get(key: string): Value;
        map<T>(f: (value: Value, index: number, record: Record) => T): T[];
    }
    class Variant {
        readonly options: readonly string[];
        readonly index: number;
        readonly value: Value;
        constructor(options: readonly string[], index: number, value: Value);
        get option(): string;
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
        value: string;
    }>;
    type Constant = Readonly<{
        type: "constant";
        value: string;
        datatype: string;
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
        slots: Readonly<{
            [key: string]: Expression[];
        }>;
    }>;
    type Match = Readonly<{
        type: "match";
        cases: Readonly<{
            [key: string]: Expression[];
        }>;
    }>;
    type Map = Readonly<{
        type: "map";
        source: string;
        target: Path;
        value: readonly APG.Expression[];
    }>;
    type Path = readonly {
        readonly type: "component" | "option";
        readonly key: string;
    }[];
    type Mapping = Readonly<{
        [key: string]: Map;
    }>;
}
export default APG;
