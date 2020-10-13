/// <reference types="node" />
import APG from "./apg.js";
export declare function encode(instance: APG.Instance): Buffer;
export declare function decode(data: Buffer, schema: APG.Schema): APG.Instance;
