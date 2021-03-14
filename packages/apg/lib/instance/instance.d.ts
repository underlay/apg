import * as Schema from "../schema/schema.js";
export declare type Instance<S extends Record<string, Schema.Type> = Record<string, Schema.Type>> = {
    readonly [key in keyof S]: Value<S[key]>[];
};
export declare const instance: <S extends Record<string, Schema.Type>>(schema: S, instance: { [key in keyof S]: Value<S[key]>[]; }) => Instance<S>;
export declare type Value<T extends Schema.Type = Schema.Type> = T extends Schema.Uri ? Uri : T extends Schema.Literal ? Literal : T extends Schema.Product<infer Components> ? Product<Components> : T extends Schema.Coproduct<infer Options> ? Coproduct<Options> : T extends Schema.Reference<infer T> ? Reference<T> : never;
declare type ValueObject = UriObject | LiteralObject | ProductObject | CoproductObject | ReferenceObject;
export declare function fromJSON(value: ValueObject): Value;
declare type ReferenceObject = {
    kind: "reference";
    index: number;
};
export declare class Reference<T extends string> {
    readonly index: number;
    static fromJSON({ index }: ReferenceObject): Reference<string>;
    constructor(index: number);
    get kind(): "reference";
    toJSON(): ReferenceObject;
}
export declare const reference: <T extends string>(type: Schema.Reference<T>, index: number) => Reference<T>;
export declare const isReference: (value: Value) => value is Reference<string>;
declare type UriObject = {
    kind: "uri";
    value: string;
};
export declare class Uri {
    readonly value: string;
    static fromJSON({ value }: UriObject): Uri;
    constructor(value: string);
    get kind(): "uri";
    toJSON(): UriObject;
}
export declare const uri: (type: Schema.Uri, value: string) => Uri;
export declare const isUri: (value: Value) => value is Uri;
declare type LiteralObject = {
    kind: "literal";
    value: string;
};
export declare class Literal {
    readonly value: string;
    static fromJSON({ value }: LiteralObject): Literal;
    constructor(value: string);
    get kind(): "literal";
    toJSON(): LiteralObject;
}
export declare const literal: <Datatype extends string = string>(type: Schema.Literal<Datatype>, value: string) => Literal;
export declare const isLiteral: (value: Value) => value is Literal;
declare type ProductObject = {
    kind: "product";
    components: ValueObject[];
};
export declare class Product<Components extends Record<string, Schema.Type> = Record<string, Schema.Type>> extends Array<Value<Components[keyof Components]>> {
    static fromJSON({ components, }: ProductObject): Product<Record<string, Schema.Type>>;
    get kind(): "product";
    constructor(values: Iterable<Value<Components[keyof Components]>>);
    toJSON(): ProductObject;
    map<V>(f: (value: Value<Components[keyof Components]>, index: number, array: Value<Components[keyof Components]>[]) => V): V[];
    get<K extends keyof Components>(type: Schema.Product<Components>, key: K): Value<Components[K]>;
}
export declare const product: <Components extends Record<string, Schema.Type> = Record<string, Schema.Type>>(type: Schema.Product<Components>, components: { readonly [key in keyof Components]: Value<Components[key]>; }) => Product<Components>;
export declare const isProduct: (value: Value) => value is Product<Record<string, Schema.Type>>;
export declare const unit: (type: Schema.Unit) => Product<{}>;
export declare const isUnit: (value: Value) => value is Product<{}>;
declare type CoproductObject = {
    kind: "coproduct";
    index: number;
    value: ValueObject;
};
export declare class Coproduct<Options extends Record<string, Schema.Type> = Record<string, Schema.Type>, Option extends keyof Options = keyof Options> {
    readonly index: number;
    readonly value: Value<Options[Option]>;
    static fromJSON({ index, value }: CoproductObject): Coproduct<Record<string, Schema.Type>, string>;
    constructor(index: number, value: Value<Options[Option]>);
    get kind(): "coproduct";
    toJSON(): CoproductObject;
    key(type: Schema.Coproduct<Options>): Option;
    is<Key extends keyof Options>(type: Schema.Coproduct<Options>, key: Key): this is Coproduct<Options, Key>;
}
export declare const coproduct: <Options extends Record<string, Schema.Type> = Record<string, Schema.Type>, Option extends keyof Options = keyof Options>(type: Schema.Coproduct<Options>, key: Option, value: Value<Options[Option]>) => Coproduct<Options, Option>;
export declare const isCoproduct: (value: Value) => value is Coproduct<Record<string, Schema.Type>, string>;
export {};
