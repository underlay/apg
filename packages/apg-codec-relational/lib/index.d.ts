import * as t from "io-ts";
import { Schema } from "@underlay/apg";
import { ul } from "@underlay/namespaces";
export declare const property: t.UnionC<[t.TypeC<{
    kind: t.LiteralC<"reference">;
    value: t.StringC;
}>, t.TypeC<{
    kind: t.LiteralC<"literal">;
    datatype: t.StringC;
}>, t.TypeC<{
    kind: t.LiteralC<"uri">;
}>]>;
export declare const optionalProperty: t.UnionC<[t.UnionC<[t.TypeC<{
    kind: t.LiteralC<"reference">;
    value: t.StringC;
}>, t.TypeC<{
    kind: t.LiteralC<"literal">;
    datatype: t.StringC;
}>, t.TypeC<{
    kind: t.LiteralC<"uri">;
}>]>, t.TypeC<{
    kind: t.LiteralC<"coproduct">;
    options: t.TypeC<{
        "http://underlay.org/ns/none": t.TypeC<{
            kind: t.LiteralC<"product">;
            components: t.TypeC<{}>;
        }>;
        "http://underlay.org/ns/some": t.UnionC<[t.TypeC<{
            kind: t.LiteralC<"reference">;
            value: t.StringC;
        }>, t.TypeC<{
            kind: t.LiteralC<"literal">;
            datatype: t.StringC;
        }>, t.TypeC<{
            kind: t.LiteralC<"uri">;
        }>]>;
    }>;
}>]>;
declare const labels: t.RecordC<t.StringC, t.TypeC<{
    kind: t.LiteralC<"product">;
    components: t.RecordC<t.StringC, t.UnionC<[t.UnionC<[t.TypeC<{
        kind: t.LiteralC<"reference">;
        value: t.StringC;
    }>, t.TypeC<{
        kind: t.LiteralC<"literal">;
        datatype: t.StringC;
    }>, t.TypeC<{
        kind: t.LiteralC<"uri">;
    }>]>, t.TypeC<{
        kind: t.LiteralC<"coproduct">;
        options: t.TypeC<{
            "http://underlay.org/ns/none": t.TypeC<{
                kind: t.LiteralC<"product">;
                components: t.TypeC<{}>;
            }>;
            "http://underlay.org/ns/some": t.UnionC<[t.TypeC<{
                kind: t.LiteralC<"reference">;
                value: t.StringC;
            }>, t.TypeC<{
                kind: t.LiteralC<"literal">;
                datatype: t.StringC;
            }>, t.TypeC<{
                kind: t.LiteralC<"uri">;
            }>]>;
        }>;
    }>]>>;
}>>;
export declare type Property = t.TypeOf<typeof property>;
export declare type OptionalProperty = t.TypeOf<typeof optionalProperty>;
export declare function isRelationalSchema(input: Schema.Schema): input is t.TypeOf<typeof labels>;
declare const codec: t.Type<{
    [x: string]: {
        kind: "product";
        components: {
            [x: string]: {
                kind: "reference";
                value: string;
            } | {
                kind: "literal";
                datatype: string;
            } | {
                kind: "uri";
            } | {
                kind: "coproduct";
                options: {
                    "http://underlay.org/ns/none": {
                        kind: "product";
                        components: {};
                    };
                    "http://underlay.org/ns/some": {
                        kind: "reference";
                        value: string;
                    } | {
                        kind: "literal";
                        datatype: string;
                    } | {
                        kind: "uri";
                    };
                };
            };
        };
    };
}, {
    [x: string]: {
        kind: "product";
        components: {
            [x: string]: {
                kind: "reference";
                value: string;
            } | {
                kind: "literal";
                datatype: string;
            } | {
                kind: "uri";
            } | {
                kind: "coproduct";
                options: {
                    "http://underlay.org/ns/none": {
                        kind: "product";
                        components: {};
                    };
                    "http://underlay.org/ns/some": {
                        kind: "reference";
                        value: string;
                    } | {
                        kind: "literal";
                        datatype: string;
                    } | {
                        kind: "uri";
                    };
                };
            };
        };
    };
}, Readonly<{
    [x: string]: Schema.Type;
}>>;
export default codec;
