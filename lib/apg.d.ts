import * as N3 from "n3.ts";
export declare type Schema<S extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}> = Readonly<S>;
export declare const schema: <S extends {
    [x: string]: Type;
}>(labels: S) => Readonly<S>;
export declare type Type = Uri | Literal | Product | Coproduct | Reference;
export interface Reference<T extends string = string> {
    readonly type: "reference";
    readonly value: T;
}
export declare const reference: <T extends string>(value: T) => Reference<T>;
export declare const isReference: (type: Type) => type is Reference<string>;
export interface Uri {
    readonly type: "uri";
}
export declare const uri: () => Uri;
export declare const isUri: (type: Type) => type is Uri;
export interface Literal<T extends string = string> {
    readonly type: "literal";
    readonly datatype: T;
}
export declare const literal: <T extends string>(datatype: T) => Literal<T>;
export declare const isLiteral: (type: Type) => type is Literal<string>;
export interface Product<Components extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}> {
    readonly type: "product";
    readonly components: Readonly<Components>;
}
export declare const product: <Components extends {
    [x: string]: Type;
} = {
    [x: string]: Type;
}>(components: Components) => Product<Components>;
export declare const isProduct: (type: Type) => type is Product<{
    [x: string]: Type;
}>;
export interface Coproduct<Options extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}> {
    readonly type: "coproduct";
    readonly options: Readonly<Options>;
}
export declare const coproduct: <Options extends {
    [x: string]: Type;
} = {
    [x: string]: Type;
}>(options: Options) => Coproduct<Options>;
export declare const isCoproduct: (type: Type) => type is Coproduct<{
    [x: string]: Type;
}>;
export declare type Instance<S extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}> = Readonly<{
    [key in keyof S]: Value<S[key]>[];
}>;
export declare const instance: <S extends {
    [x: string]: Type;
}>(schema: S, instance: { [key in keyof S]: Value<S[key]>[]; }) => Readonly<{ [key_1 in keyof S]: Value<S[key_1]>[]; }>;
export declare type Value<T extends Type = Type> = T extends Uri ? N3.NamedNode : T extends Literal<infer D> ? N3.Literal<D> : T extends Product<infer Components> ? Record<Components> : T extends Coproduct<infer Options> ? Variant<Options> : T extends Reference ? Pointer : never;
export declare class Pointer {
    readonly index: number;
    constructor(index: number);
    get termType(): "Pointer";
}
export declare const isPointer: (value: Value) => value is Pointer;
export declare const isNamedNode: (value: Value) => value is N3.NamedNode<string>;
export declare const isLiteralValue: (value: Value) => value is N3.Literal<string>;
export declare class Record<Components extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}> extends Array<Value<Components[keyof Components]>> {
    readonly components: readonly (keyof Components)[];
    get termType(): "Record";
    constructor(components: readonly (keyof Components)[], values: Iterable<Value<Components[keyof Components]>>);
    get<K extends keyof Components>(key: K): Value<Components[K]>;
    map<V>(f: (value: Value<Components[keyof Components]>, index: number, record: Record<Components>) => V): V[];
}
export declare const isRecord: (value: Value) => value is Record<{
    [x: string]: Type;
}>;
export declare const unit: () => Record<{}>;
export declare class Variant<Options extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}, Option extends keyof Options = keyof Options> {
    readonly options: readonly (keyof Options)[];
    readonly key: Option;
    readonly value: Value<Options[Option]>;
    readonly index: number;
    constructor(options: readonly (keyof Options)[], key: Option, value: Value<Options[Option]>);
    get termType(): "Variant";
    is<Key extends keyof Options>(key: Key): this is Variant<Options, Key>;
}
export declare const isVariant: (value: Value) => value is Variant<{
    [x: string]: Type;
}, string>;
export declare type Expression = Identifier | Constant | Dereference | Projection | Injection | Tuple | Match;
export interface Identifier<T extends string = string> {
    readonly type: "identifier";
    readonly value: T;
}
export declare const identifier: <Value_1 extends string>(value: Value_1) => Identifier<Value_1>;
export interface Constant<Datatype extends string = string, Value extends string = string> {
    readonly type: "constant";
    readonly value: Value;
    readonly datatype: Datatype;
}
export declare const constant: <Datatype extends string = string, Value_1 extends string = string>(value: Value_1, datatype: Datatype) => Constant<Datatype, Value_1>;
export interface Dereference<Key extends string = string> {
    readonly type: "dereference";
    readonly key: Key;
}
export declare const dereference: <Key extends string = string>(key: Key) => Dereference<Key>;
export interface Projection<Key extends string = string> {
    readonly type: "projection";
    readonly key: Key;
}
export declare const projection: <Key extends string = string>(key: Key) => Projection<Key>;
export interface Injection<Key extends string = string> {
    readonly type: "injection";
    readonly key: Key;
}
export declare const injection: <Key extends string = string>(key: Key) => Injection<Key>;
export interface Tuple {
    readonly type: "tuple";
    readonly slots: Readonly<{
        [key in string]: Expression[];
    }>;
}
export declare const tuple: (slots: Readonly<{
    [x: string]: Expression[];
}>) => Tuple;
export interface Match {
    readonly type: "match";
    readonly cases: Readonly<{
        [key in string]: Expression[];
    }>;
}
export declare const match: (cases: Readonly<{
    [x: string]: Expression[];
}>) => Match;
export interface Map {
    readonly type: "map";
    readonly source: string;
    readonly value: readonly Expression[];
}
export declare const map: (source: string, value: readonly Expression[]) => Map;
export declare type Mapping = Readonly<{
    [key: string]: Map;
}>;
export declare const mapping: (maps: Readonly<{
    [key: string]: Map;
}>) => Mapping;
