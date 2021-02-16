import * as Schema from "../schema/schema.js";
export declare type Instance<S extends Record<string, Schema.Type> = Record<string, Schema.Type>> = {
    readonly [key in keyof S]: Value<S[key]>[];
};
export declare const instance: <S extends Record<string, Schema.Type>>(schema: S, instance: { [key in keyof S]: Value<S[key]>[]; }) => Instance<S>;
export declare type Value<T extends Schema.Type = Schema.Type> = T extends Schema.Uri ? Uri<string> : T extends Schema.Literal ? Literal : T extends Schema.Product<infer Components> ? Product<Components> : T extends Schema.Coproduct<infer Options> ? Coproduct<Options> : T extends Schema.Reference ? Reference : never;
export declare class Reference {
    readonly index: number;
    constructor(index: number);
    get kind(): "reference";
}
export declare const reference: (type: Schema.Reference, index: number) => Reference;
export declare const isReference: (value: Value) => value is Reference;
export declare class Uri<Value extends string = string> {
    readonly value: Value;
    constructor(value: Value);
    get kind(): "uri";
}
export declare const uri: <Value_1 extends string = string>(type: Schema.Uri, value: Value_1) => Uri<Value_1>;
export declare const isUri: (value: Value) => value is Uri<string>;
export declare class Literal {
    readonly value: string;
    constructor(value: string);
    get kind(): "literal";
}
export declare const literal: <Datatype extends string = string>(type: Schema.Literal<Datatype>, value: string) => Literal;
export declare const isLiteral: (value: Value) => value is Literal;
export declare class Product<Components extends Record<string, Schema.Type> = Record<string, Schema.Type>> extends Array<Value<Components[keyof Components]>> {
    get kind(): "product";
    constructor(values: Iterable<Value<Components[keyof Components]>>);
    get<K extends keyof Components>(type: Schema.Product<Components>, key: K): Value<Components[K]>;
}
export declare const product: <Components extends Record<string, Schema.Type> = Record<string, Schema.Type>>(type: Schema.Product<Components>, components: { readonly [key in keyof Components]: Value<Components[key]>; }) => Product<Components>;
export declare const isProduct: (value: Value) => value is Product<Record<string, Schema.Type>>;
export declare const unit: (type: Schema.Unit) => Product<{}>;
export declare const isUnit: (value: Value) => value is Product<{}>;
export declare class Coproduct<Options extends Record<string, Schema.Type> = Record<string, Schema.Type>, Option extends keyof Options = keyof Options> {
    readonly index: number;
    readonly value: Value<Options[Option]>;
    constructor(index: number, value: Value<Options[Option]>);
    get kind(): "coproduct";
    key(type: Schema.Coproduct<Options>): Option;
    is<Key extends keyof Options>(type: Schema.Coproduct<Options>, key: Key): this is Coproduct<Options, Key>;
}
export declare const coproduct: <Options extends Record<string, Schema.Type> = Record<string, Schema.Type>, Option extends keyof Options = keyof Options>(type: Schema.Coproduct<Options>, key: Option, value: Value<Options[Option]>) => Coproduct<Options, Option>;
export declare const isCoproduct: (value: Value) => value is Coproduct<Record<string, Schema.Type>, string>;
