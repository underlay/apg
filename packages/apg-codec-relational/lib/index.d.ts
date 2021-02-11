import * as t from "io-ts";
import { Schema } from "@underlay/apg";
import { ul } from "@underlay/namespaces";
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
export declare function isRelationalSchema(input: Schema.Schema): input is t.TypeOf<typeof labels>;
declare const codec: t.Type<{
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
    [x: string]: Schema.Type;
}>>;
export default codec;
