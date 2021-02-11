/// <reference types="node" />
import { Schema, Instance } from "@underlay/apg";
export declare function decode<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>, data: Buffer): Instance.Instance<S>;
export declare function log<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>, data: Buffer): void;
