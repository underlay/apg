/// <reference types="node" />
import { Schema, Instance } from "@underlay/apg";
export declare function encode<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>, instance: Instance.Instance<S>): Buffer;
export declare function encodeValue(type: Schema.Type, value: Instance.Value, namedNodeIds: Map<string, number>): Generator<Uint8Array, void, undefined>;
export declare function encodeLiteral(type: Schema.Literal, value: Instance.Literal): Generator<Uint8Array, void, undefined>;
