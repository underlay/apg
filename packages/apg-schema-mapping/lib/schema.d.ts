import { Schema } from "@underlay/apg";
import { ul } from "@underlay/namespaces";
export declare const caseLabel: Schema.Product<{
    "http://underlay.org/ns/key": Schema.Uri;
    "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/match">;
    "http://underlay.org/ns/value": Schema.Reference<"http://underlay.org/ns/expression">;
}>;
export declare const expression: Schema.Coproduct<{
    "http://underlay.org/ns/constant": Schema.Product<{
        "http://underlay.org/ns/datatype": Schema.Uri;
        "http://underlay.org/ns/value": Schema.Literal<"http://www.w3.org/2001/XMLSchema#string">;
    }>;
    "http://underlay.org/ns/dereference": Schema.Uri;
    "http://underlay.org/ns/identifier": Schema.Uri;
    "http://underlay.org/ns/injection": Schema.Uri;
    "http://underlay.org/ns/match": Schema.Reference<"http://underlay.org/ns/match">;
    "http://underlay.org/ns/tuple": Schema.Reference<"http://underlay.org/ns/tuple">;
}>;
export declare const expressionLabel: Schema.Coproduct<{
    "http://underlay.org/ns/none": Schema.Product<{}>;
    "http://underlay.org/ns/some": Schema.Product<{
        "http://underlay.org/ns/head": Schema.Coproduct<{
            "http://underlay.org/ns/constant": Schema.Product<{
                "http://underlay.org/ns/datatype": Schema.Uri;
                "http://underlay.org/ns/value": Schema.Literal<"http://www.w3.org/2001/XMLSchema#string">;
            }>;
            "http://underlay.org/ns/dereference": Schema.Uri;
            "http://underlay.org/ns/identifier": Schema.Uri;
            "http://underlay.org/ns/injection": Schema.Uri;
            "http://underlay.org/ns/match": Schema.Reference<"http://underlay.org/ns/match">;
            "http://underlay.org/ns/tuple": Schema.Reference<"http://underlay.org/ns/tuple">;
        }>;
        "http://underlay.org/ns/tail": Schema.Reference<"http://underlay.org/ns/expression">;
    }>;
}>;
export declare const mapLabel: Schema.Product<{
    "http://underlay.org/ns/key": Schema.Uri;
    "http://underlay.org/ns/source": Schema.Uri;
    "http://underlay.org/ns/value": Schema.Reference<"http://underlay.org/ns/expression">;
}>;
export declare const matchLabel: Schema.Product<{}>;
export declare const slotLabel: Schema.Product<{
    "http://underlay.org/ns/key": Schema.Uri;
    "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/tuple">;
    "http://underlay.org/ns/value": Schema.Reference<"http://underlay.org/ns/expression">;
}>;
export declare const tupleLabel: Schema.Product<{}>;
declare const mappingSchema: Readonly<{
    "http://underlay.org/ns/case": Schema.Product<{
        "http://underlay.org/ns/key": Schema.Uri;
        "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/match">;
        "http://underlay.org/ns/value": Schema.Reference<"http://underlay.org/ns/expression">;
    }>;
    "http://underlay.org/ns/expression": Schema.Coproduct<{
        "http://underlay.org/ns/none": Schema.Product<{}>;
        "http://underlay.org/ns/some": Schema.Product<{
            "http://underlay.org/ns/head": Schema.Coproduct<{
                "http://underlay.org/ns/constant": Schema.Product<{
                    "http://underlay.org/ns/datatype": Schema.Uri;
                    "http://underlay.org/ns/value": Schema.Literal<"http://www.w3.org/2001/XMLSchema#string">;
                }>;
                "http://underlay.org/ns/dereference": Schema.Uri;
                "http://underlay.org/ns/identifier": Schema.Uri;
                "http://underlay.org/ns/injection": Schema.Uri;
                "http://underlay.org/ns/match": Schema.Reference<"http://underlay.org/ns/match">;
                "http://underlay.org/ns/tuple": Schema.Reference<"http://underlay.org/ns/tuple">;
            }>;
            "http://underlay.org/ns/tail": Schema.Reference<"http://underlay.org/ns/expression">;
        }>;
    }>;
    "http://underlay.org/ns/map": Schema.Product<{
        "http://underlay.org/ns/key": Schema.Uri;
        "http://underlay.org/ns/source": Schema.Uri;
        "http://underlay.org/ns/value": Schema.Reference<"http://underlay.org/ns/expression">;
    }>;
    "http://underlay.org/ns/match": Schema.Product<{}>;
    "http://underlay.org/ns/slot": Schema.Product<{
        "http://underlay.org/ns/key": Schema.Uri;
        "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/tuple">;
        "http://underlay.org/ns/value": Schema.Reference<"http://underlay.org/ns/expression">;
    }>;
    "http://underlay.org/ns/tuple": Schema.Product<{}>;
}>;
export declare type MappingSchema = typeof mappingSchema;
export default mappingSchema;
