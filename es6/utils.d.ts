import APG from "./apg.js";
export declare function signalInvalidType(type: never): never;
export declare function forType(type: APG.Type, stack?: APG.Type[]): Generator<[APG.Type, APG.Type[]], void, undefined>;
export declare function forValue(value: APG.Value): Generator<[APG.Value], void, undefined>;
export declare function equal(a: APG.Type, b: APG.Type): boolean;
export declare const rootId: string;
export declare function getId(): string;
