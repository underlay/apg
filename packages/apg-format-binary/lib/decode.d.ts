/// <reference types="node" />
import { Schema, Instance } from "@underlay/apg";
declare type State = {
    uris: Instance.Uri[];
    data: Buffer;
    offset: number;
};
export declare function decode<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>, data: Buffer): Instance.Instance<S>;
export declare function decodeValue(state: State, type: Schema.Type): Instance.Value;
export declare function decodeLiteral(state: {
    data: Buffer;
    offset: number;
}, datatype: string): string;
export declare function log<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>, data: Buffer): void;
export declare function logValue(prefix: string, state: {
    data: Buffer;
    offset: number;
}, type: Schema.Type): void;
export {};
