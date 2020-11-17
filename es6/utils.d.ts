import { BlankNode } from "n3.ts";
export declare function signalInvalidType(type: never): never;
export declare const rootId: string;
export declare type ID = () => BlankNode;
export declare function getID(): ID;
