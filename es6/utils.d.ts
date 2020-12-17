declare type R<K extends string = string, V = any> = Readonly<Record<K, V>>;
export declare function forEntries<K extends string = string, V = any>(object: R<K, V>): Generator<[K, V, number], void, undefined>;
export declare function getKeys<T extends R = R>(object: T): readonly (keyof T)[];
export declare function getKeyIndex(object: Readonly<{
    [key: string]: any;
}>, key: string): number;
export declare function mapKeys<T, K extends string = string, V = any>(object: R<K, V>, map: <Key extends K>(value: R[Key], key: Key) => T): {
    [k: string]: T;
};
export declare function signalInvalidType(type: never): never;
export declare const rootId: string;
export {};
