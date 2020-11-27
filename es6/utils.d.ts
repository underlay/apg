import { BlankNode } from "n3.ts";
import APG from "./apg";
export declare function getEntries<T>(object: Readonly<{
    [key: string]: T;
}>): Generator<[string, T], void, undefined>;
export declare function getKeys(object: Readonly<{
    [key: string]: any;
}>): readonly string[];
export declare function getKeyIndex(object: Readonly<{
    [key: string]: any;
}>, key: string): number;
export declare function mapKeys<S, T>(object: Readonly<{
    [key: string]: S;
}>, map: (value: S, key: string) => T): {
    [k: string]: T;
};
export declare function signalInvalidType(type: never): never;
export declare const rootId: string;
export declare type ID = () => BlankNode;
export declare function getID(): ID;
export declare function freezeType(type: APG.Type): void;
