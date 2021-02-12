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
    readonly kind: "reference";
    readonly value: T;
}
export declare const reference: <T extends string>(value: T) => Reference<T>;
export declare const isReference: (type: Type) => type is Reference<string>;
export interface Uri {
    readonly kind: "uri";
}
export declare const uri: () => Uri;
export declare const isUri: (type: Type) => type is Uri;
export interface Literal<T extends string = string> {
    readonly kind: "literal";
    readonly datatype: T;
}
export declare const literal: <T extends string>(datatype: T) => Literal<T>;
export declare const isLiteral: (type: Type) => type is Literal<string>;
export interface Product<Components extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}> {
    readonly kind: "product";
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
export declare type Unit = Product<{}>;
export declare const unit: () => Product<{}>;
export declare const isUnit: (type: Type) => type is Unit;
export interface Coproduct<Options extends {
    [key in string]: Type;
} = {
    [key in string]: Type;
}> {
    readonly kind: "coproduct";
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
