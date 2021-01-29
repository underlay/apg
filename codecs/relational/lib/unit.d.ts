import { Schema } from "@underlay/apg";
export declare type Unit = Schema.Product<{}>;
export declare const isUnit: (type: Schema.Type) => type is Unit;
