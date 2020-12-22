import * as t from "io-ts";
import * as APG from "../apg.js";
import * as ns from "../namespace.js";
declare const labels: t.RecordC<t.StringC, t.TypeC<{
    type: t.LiteralC<"product">;
    components: t.RecordC<t.StringC, t.UnionC<[t.UnionC<[t.TypeC<{
        type: t.LiteralC<"reference">;
        value: t.StringC;
    }>, t.TypeC<{
        type: t.LiteralC<"literal">;
        datatype: t.StringC;
    }>, t.TypeC<{
        type: t.LiteralC<"uri">;
    }>]>, t.TypeC<{
        type: t.LiteralC<"coproduct">;
        options: t.TypeC<{
            "http://underlay.org/ns/none": t.TypeC<{
                type: t.LiteralC<"product">;
                components: t.TypeC<{}>;
            }>;
            "http://underlay.org/ns/some": t.UnionC<[t.TypeC<{
                type: t.LiteralC<"reference">;
                value: t.StringC;
            }>, t.TypeC<{
                type: t.LiteralC<"literal">;
                datatype: t.StringC;
            }>, t.TypeC<{
                type: t.LiteralC<"uri">;
            }>]>;
        }>;
    }>]>>;
}>>;
export declare function isRelationalSchema(input: APG.Schema): input is t.TypeOf<typeof labels>;
export declare const relationalSchema: t.Type<{
    [x: string]: {
        type: "product";
        components: {
            [x: string]: {
                type: "reference";
                value: string;
            } | {
                type: "literal";
                datatype: string;
            } | {
                type: "uri";
            } | {
                type: "coproduct";
                options: {
                    "http://underlay.org/ns/none": {
                        type: "product";
                        components: {};
                    };
                    "http://underlay.org/ns/some": {
                        type: "reference";
                        value: string;
                    } | {
                        type: "literal";
                        datatype: string;
                    } | {
                        type: "uri";
                    };
                };
            };
        };
    };
}, {
    [x: string]: {
        type: "product";
        components: {
            [x: string]: {
                type: "reference";
                value: string;
            } | {
                type: "literal";
                datatype: string;
            } | {
                type: "uri";
            } | {
                type: "coproduct";
                options: {
                    "http://underlay.org/ns/none": {
                        type: "product";
                        components: {};
                    };
                    "http://underlay.org/ns/some": {
                        type: "reference";
                        value: string;
                    } | {
                        type: "literal";
                        datatype: string;
                    } | {
                        type: "uri";
                    };
                };
            };
        };
    };
}, Readonly<{
    [x: string]: APG.Type;
}>>;
export {};
