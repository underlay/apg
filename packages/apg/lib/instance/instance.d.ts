import * as Schema from "../schema/schema.js";
export declare type Instance<S extends {
    [key in string]: Schema.Type;
} = {
    [key in string]: Schema.Type;
}> = {
    readonly [key in keyof S]: Value<S[key]>[];
};
export declare const instance: <S extends {
    [x: string]: Schema.Type;
}>(schema: S, instance: { [key in keyof S]: Value<S[key]>[]; }) => Instance<S>;
export declare type Value<T extends Schema.Type = Schema.Type> = T extends Schema.Uri ? Uri<string> : T extends Schema.Literal<infer Datatype> ? Literal<Datatype> : T extends Schema.Product<infer Components> ? Product<Components> : T extends Schema.Coproduct<infer Options> ? Coproduct<Options> : T extends Schema.Reference ? Reference : never;
export declare class Reference {
    readonly index: number;
    constructor(index: number);
    get type(): "reference";
}
export declare const reference: (index: number) => Reference;
export declare const isReference: (value: Value) => value is Reference;
export declare class Uri<Value extends string = string> {
    readonly value: Value;
    constructor(value: Value);
    get type(): "uri";
}
export declare const uri: <Value_1 extends string = string>(value: Value_1) => Uri<Value_1>;
export declare const isUri: (value: Value) => value is Uri<string>;
export declare class Literal<Datatype extends string = string> {
    readonly value: string;
    readonly datatype: Uri<Datatype>;
    constructor(value: string, datatype: Uri<Datatype>);
    get type(): "literal";
}
export declare const literal: <Datatype extends string = string>(value: string, datatype: Uri<Datatype>) => Literal<Datatype>;
export declare const isLiteral: (value: Value) => value is Literal<string>;
export declare class Product<Components extends {
    [key in string]: Schema.Type;
} = {
    [key in string]: Schema.Type;
}> extends Array<Value<Components[keyof Components]>> {
    readonly components: readonly (keyof Components)[];
    get type(): "product";
    constructor(components: readonly (keyof Components)[], values: Iterable<Value<Components[keyof Components]>>);
    get<K extends keyof Components>(key: K): Value<Components[K]>;
    map<V>(f: (value: Value<Components[keyof Components]>, index: number, record: Product<Components>) => V): V[];
}
export declare const product: <Components extends {
    [x: string]: Schema.Type;
} = {
    [x: string]: Schema.Type;
}>(components: readonly (keyof Components)[], values: Iterable<Value<Components[keyof Components]>>) => Product<Components>;
export declare const isProduct: (value: Value) => value is Product<{
    [x: string]: Schema.Type;
}>;
export declare const unit: () => Product<{}>;
export declare class Coproduct<Options extends {
    [key in string]: Schema.Type;
} = {
    [key in string]: Schema.Type;
}, Option extends keyof Options = keyof Options> {
    readonly options: readonly (keyof Options)[];
    readonly key: Option;
    readonly value: Value<Options[Option]>;
    readonly index: number;
    constructor(options: readonly (keyof Options)[], key: Option, value: Value<Options[Option]>);
    get type(): "coproduct";
    is<Key extends keyof Options>(key: Key): this is Coproduct<Options, Key>;
}
export declare const coproduct: <Options extends {
    [x: string]: Schema.Type;
} = {
    [x: string]: Schema.Type;
}, Option extends keyof Options = keyof Options>(options: readonly (keyof Options)[], key: Option, value: Value<Options[Option]>) => Coproduct<Options, Option>;
export declare const isCoproduct: (value: Value) => value is Coproduct<{
    [x: string]: Schema.Type;
}, string>;
