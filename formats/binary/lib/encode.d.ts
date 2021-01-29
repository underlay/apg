/// <reference types="node" />
import { Schema, Instance } from "@underlay/apg";
export declare function encode<S extends {
    [key in string]: Schema.Type;
}>(schema: Schema.Schema<S>, instance: Instance.Instance<S>): Buffer;
