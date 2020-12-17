import * as N3 from "n3.ts";
declare type TypeMap = Record<string, APG.Type>;
declare type ExpressionMap = Record<string, APG.Expression[]>;
declare namespace APG {
    type Schema<T extends TypeMap = TypeMap> = T;
    const schema: <T extends globalThis.Record<string, Type>>(labels: T) => T;
    type Type = Uri | Literal | Product | Coproduct | Reference;
    interface Reference<T extends string = string> {
        readonly type: "reference";
        readonly value: T;
    }
    const reference: <T extends string>(value: T) => Reference<T>;
    interface Uri {
        readonly type: "uri";
    }
    const uri: () => Uri;
    interface Literal<T extends string = string> {
        readonly type: "literal";
        readonly datatype: T;
    }
    const literal: <T extends string>(datatype: T) => Literal<T>;
    interface Product<T extends TypeMap = TypeMap> {
        readonly type: "product";
        readonly components: Readonly<T>;
    }
    const product: <T extends globalThis.Record<string, Type>>(components: T) => Product<T>;
    interface Coproduct<T extends TypeMap = TypeMap> {
        readonly type: "coproduct";
        readonly options: Readonly<T>;
    }
    const coproduct: <T extends globalThis.Record<string, Type>>(options: T) => Coproduct<T>;
    type Instance<S extends Schema = Schema> = Readonly<{
        [key in keyof S]: Value<S[key]>[];
    }>;
    type Value<T extends Type = Type> = T extends Uri ? N3.NamedNode : T extends Literal ? N3.Literal : T extends Product<infer Components> ? Record<Components> : T extends Coproduct<infer Options> ? Variant<Options> : T extends Reference ? Pointer : never;
    class Pointer {
        readonly index: number;
        constructor(index: number);
        get termType(): "Pointer";
    }
    class Record<T extends TypeMap = TypeMap> extends Array<Value<T[keyof T]>> {
        readonly components: readonly (keyof T)[];
        get termType(): "Record";
        constructor(components: readonly (keyof T)[], values: Iterable<Value<T[keyof T]>>);
        get<K extends keyof T>(key: K): Value<T[K]>;
        map<V>(f: (value: Value<T[keyof T]>, index: number, record: Record<T>) => V): V[];
    }
    const unit: () => Record<{}>;
    class Variant<T extends TypeMap = TypeMap, K extends keyof T = keyof T> {
        readonly options: readonly (keyof T)[];
        readonly key: K;
        readonly value: Value<T[K]>;
        readonly index: number;
        constructor(options: readonly (keyof T)[], key: K, value: Value<T[K]>);
        get termType(): "Variant";
        is<Key extends K>(key: Key): this is Variant<T, Key>;
    }
    type Expression = Identity | Identifier | Constant | Dereference | Projection | Injection | Tuple | Match;
    interface Identity {
        readonly type: "identity";
    }
    const identity: () => Identity;
    interface Identifier<T extends string = string> {
        readonly type: "identifier";
        readonly value: T;
    }
    const identifier: <Value_1 extends string>(value: Value_1) => Identifier<Value_1>;
    interface Constant<Datatype extends string = string, Value extends string = string> {
        readonly type: "constant";
        readonly value: Value;
        readonly datatype: Datatype;
    }
    const constant: <Datatype extends string = string, Value_1 extends string = string>(value: Value_1, datatype: Datatype) => Constant<Datatype, Value_1>;
    interface Dereference<Key extends string = string> {
        readonly type: "dereference";
        readonly key: Key;
    }
    const dereference: <Key extends string = string>(key: Key) => Dereference<Key>;
    interface Projection<Key extends string = string> {
        readonly type: "projection";
        readonly key: Key;
    }
    const projection: <Key extends string = string>(key: Key) => Projection<Key>;
    interface Injection<Key extends string = string, Value extends readonly Expression[] = readonly Expression[]> {
        readonly type: "injection";
        readonly key: Key;
        readonly value: Value;
    }
    const injection: <Key extends string = string, Value_1 extends readonly Expression[] = readonly Expression[]>(key: Key, value: Value_1) => Injection<Key, Value_1>;
    interface Tuple {
        readonly type: "tuple";
        readonly slots: Readonly<ExpressionMap>;
    }
    const tuple: (slots: Readonly<ExpressionMap>) => Tuple;
    interface Match {
        readonly type: "match";
        readonly cases: Readonly<ExpressionMap>;
    }
    const match: (cases: Readonly<ExpressionMap>) => Match;
    interface Map {
        readonly type: "map";
        readonly source: string;
        readonly value: readonly APG.Expression[];
    }
    const map: (source: string, value: readonly APG.Expression[]) => Map;
    type Mapping = Readonly<{
        [key: string]: Map;
    }>;
    const mapping: (maps: Readonly<{
        [key: string]: Map;
    }>) => Mapping;
}
export default APG;
