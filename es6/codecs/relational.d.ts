import * as t from "io-ts";
import APG from "../apg.js";
declare const labels: t.ArrayC<t.TypeC<{
    type: t.LiteralC<"label">;
    key: t.StringC;
    value: t.UnionC<[t.TypeC<{
        type: t.LiteralC<"unit">;
    }>, t.TypeC<{
        type: t.LiteralC<"product">;
        components: t.ArrayC<t.TypeC<{
            type: t.LiteralC<"component">;
            key: t.StringC;
            value: t.UnionC<[t.UnionC<[t.TypeC<{
                type: t.LiteralC<"reference">;
                value: t.NumberC;
            }>, t.TypeC<{
                type: t.LiteralC<"literal">;
                datatype: t.StringC;
            }>, t.TypeC<{
                type: t.LiteralC<"iri">;
            }>]>, t.TypeC<{
                type: t.LiteralC<"coproduct">;
                options: t.TupleC<[t.TypeC<{
                    type: t.LiteralC<"option">;
                    key: t.LiteralC<"http://underlay.org/ns/none">;
                    value: t.TypeC<{
                        type: t.LiteralC<"unit">;
                    }>;
                }>, t.TypeC<{
                    type: t.LiteralC<"option">;
                    key: t.LiteralC<"http://underlay.org/ns/some">;
                    value: t.UnionC<[t.TypeC<{
                        type: t.LiteralC<"reference">;
                        value: t.NumberC;
                    }>, t.TypeC<{
                        type: t.LiteralC<"literal">;
                        datatype: t.StringC;
                    }>, t.TypeC<{
                        type: t.LiteralC<"iri">;
                    }>]>;
                }>]>;
            }>]>;
        }>>;
    }>]>;
}>>;
export declare function isRelationalSchema(input: APG.Schema): input is t.TypeOf<typeof labels>;
export declare const relationalSchema: t.Type<{
    type: "label";
    key: string;
    value: {
        type: "unit";
    } | {
        type: "product";
        components: {
            type: "component";
            key: string;
            value: {
                type: "reference";
                value: number;
            } | {
                type: "literal";
                datatype: string;
            } | {
                type: "iri";
            } | {
                type: "coproduct";
                options: [{
                    type: "option";
                    key: "http://underlay.org/ns/none";
                    value: {
                        type: "unit";
                    };
                }, {
                    type: "option";
                    key: "http://underlay.org/ns/some";
                    value: {
                        type: "reference";
                        value: number;
                    } | {
                        type: "literal";
                        datatype: string;
                    } | {
                        type: "iri";
                    };
                }];
            };
        }[];
    };
}[], {
    type: "label";
    key: string;
    value: {
        type: "unit";
    } | {
        type: "product";
        components: {
            type: "component";
            key: string;
            value: {
                type: "reference";
                value: number;
            } | {
                type: "literal";
                datatype: string;
            } | {
                type: "iri";
            } | {
                type: "coproduct";
                options: [{
                    type: "option";
                    key: "http://underlay.org/ns/none";
                    value: {
                        type: "unit";
                    };
                }, {
                    type: "option";
                    key: "http://underlay.org/ns/some";
                    value: {
                        type: "reference";
                        value: number;
                    } | {
                        type: "literal";
                        datatype: string;
                    } | {
                        type: "iri";
                    };
                }];
            };
        }[];
    };
}[], APG.Schema>;
export {};
