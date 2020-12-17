import * as N3 from "n3.ts";
declare type ExpressionMap = Record<string, APG.Expression[]>;
declare namespace APG {
    type Schema<S extends {
        [key in string]: APG.Type;
    } = {
        [key in string]: APG.Type;
    }> = Readonly<S>;
    const schema: <S extends {
        [x: string]: Type;
    }>(labels: S) => Readonly<S>;
    type Type = Uri | Literal | Product | Coproduct | Reference;
    interface Reference<T extends string = string> {
        readonly type: "reference";
        readonly value: T;
    }
    const reference: <T extends string>(value: T) => Reference<T>;
    const isReference: (type: APG.Type) => type is Reference<string>;
    interface Uri {
        readonly type: "uri";
    }
    const uri: () => Uri;
    const isUri: (type: APG.Type) => type is Uri;
    interface Literal<T extends string = string> {
        readonly type: "literal";
        readonly datatype: T;
    }
    const literal: <T extends string>(datatype: T) => Literal<T>;
    const isLiteral: (type: APG.Type) => type is Literal<string>;
    interface Product<Components extends {
        [key in string]: APG.Type;
    } = {
        [key in string]: APG.Type;
    }> {
        readonly type: "product";
        readonly components: Readonly<Components>;
    }
    const product: <Components extends {
        [x: string]: Type;
    } = {
        [x: string]: Type;
    }>(components: Components) => Product<Components>;
    const isProduct: (type: APG.Type) => type is Product<{
        [x: string]: Type;
    }>;
    interface Coproduct<Options extends {
        [key in string]: APG.Type;
    } = {
        [key in string]: APG.Type;
    }> {
        readonly type: "coproduct";
        readonly options: Readonly<Options>;
    }
    const coproduct: <Options extends {
        [x: string]: Type;
    } = {
        [x: string]: Type;
    }>(options: Options) => Coproduct<Options>;
    const isCoproduct: (type: APG.Type) => type is Coproduct<{
        [x: string]: Type;
    }>;
    type Instance<S extends {
        [key in string]: APG.Type;
    } = {
        [key in string]: APG.Type;
    }> = Readonly<{
        [key in keyof S]: Value<S[key]>[];
    }>;
    const instance: <S extends {
        [x: string]: Type;
    }>(schema: S, instance: { [key in keyof S]: Value<S[key]>[]; }) => Readonly<{ [key_1 in keyof S]: Value<S[key_1]>[]; }>;
    type Value<T extends Type = Type> = T extends Uri ? N3.NamedNode : T extends Literal<infer D> ? N3.Literal<D> : T extends Product<infer Components> ? Record<Components> : T extends Coproduct<infer Options> ? Variant<Options> : T extends Reference ? Pointer : never;
    class Pointer {
        readonly index: number;
        constructor(index: number);
        get termType(): "Pointer";
    }
    const isPointer: (value: APG.Value) => value is Pointer;
    const isNamedNode: (value: APG.Value) => value is N3.NamedNode<string>;
    const isLiteralValue: (value: APG.Value) => value is N3.Literal<string>;
    class Record<Components extends {
        [key in string]: APG.Type;
    } = {
        [key in string]: APG.Type;
    }> extends Array<Value<Components[keyof Components]>> {
        readonly components: readonly (keyof Components)[];
        get termType(): "Record";
        constructor(components: readonly (keyof Components)[], values: Iterable<Value<Components[keyof Components]>>);
        get<K extends keyof Components>(key: K): Value<Components[K]>;
        map<V>(f: (value: Value<Components[keyof Components]>, index: number, record: Record<Components>) => V): V[];
    }
    const isRecord: (value: APG.Value) => value is Record<{
        [x: string]: Type;
    }>;
    const unit: () => Record<{}>;
    class Variant<Options extends {
        [key in string]: APG.Type;
    } = {
        [key in string]: APG.Type;
    }, Option extends keyof Options = keyof Options> {
        readonly options: readonly (keyof Options)[];
        readonly key: Option;
        readonly value: Value<Options[Option]>;
        readonly index: number;
        constructor(options: readonly (keyof Options)[], key: Option, value: Value<Options[Option]>);
        get termType(): "Variant";
        is<Key extends keyof Options>(key: Key): this is Variant<Options, Key>;
    }
    const isVariant: (value: APG.Value) => value is Variant<{
        [x: string]: Type;
    }, string>;
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
