export * from "./utils.js";
export * from "./apply.js";
export declare type Expression = Identifier | Constant | Dereference | Projection | Injection | Tuple | Match;
export interface Identifier<Value extends string = string> {
    readonly type: "identifier";
    readonly value: Value;
}
export declare const identifier: <Value extends string>(value: Value) => Identifier<Value>;
export interface Constant<Datatype extends string = string, Value extends string = string> {
    readonly type: "constant";
    readonly value: Value;
    readonly datatype: Datatype;
}
export declare const constant: <Datatype extends string = string, Value extends string = string>(value: Value, datatype: Datatype) => Constant<Datatype, Value>;
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
    readonly slots: {
        readonly [key in string]: Expression[];
    };
}
export declare const tuple: (slots: {
    readonly [x: string]: Expression[];
}) => Tuple;
export interface Match {
    readonly type: "match";
    readonly cases: {
        readonly [key in string]: Expression[];
    };
}
export declare const match: (cases: {
    readonly [x: string]: Expression[];
}) => Match;
export interface Map {
    readonly type: "map";
    readonly source: string;
    readonly value: readonly Expression[];
}
export declare const map: (source: string, value: readonly Expression[]) => Map;
export declare type Mapping = {
    readonly [key: string]: Map;
};
export declare const mapping: (maps: {
    readonly [key: string]: Map;
}) => Mapping;
