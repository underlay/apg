declare type R<K extends string, V extends any = any> = Readonly<Record<K, V>>;
export declare function forEntries<K extends string, V extends any>(object: R<K, V>): Generator<[K, V, number], void, undefined>;
export declare function getKeys<K extends string>(object: R<K>): readonly K[];
export declare function getKeyIndex<K extends string>(object: R<K>, key: K): number;
export declare function mapKeys<S extends {
    readonly [key in string]: any;
}, T>(object: S, map: <Key extends keyof S>(value: S[Key], key: Key) => T): {
    readonly [key in keyof S]: T;
};
export declare function signalInvalidType(type: never): never;
export declare type ZIterable<E> = E extends Iterable<any>[] ? {
    [k in keyof E]: E[k] extends Iterable<infer T> ? T : E[k];
} : never;
export declare const zip: <E extends Iterable<any>[]>(...args: E) => Iterable<[...ZIterable<E>, number]>;
export {};