import { Schema } from "@underlay/apg";
export declare const value: Schema.Coproduct<{
    "http://underlay.org/ns/reference": Schema.Reference<"http://underlay.org/ns/label">;
    "http://underlay.org/ns/uri": Schema.Product<{}>;
    "http://underlay.org/ns/literal": Schema.Uri;
    "http://underlay.org/ns/product": Schema.Reference<"http://underlay.org/ns/product">;
    "http://underlay.org/ns/coproduct": Schema.Reference<"http://underlay.org/ns/coproduct">;
}>;
export declare const label: Schema.Product<{
    "http://underlay.org/ns/key": Schema.Uri;
    "http://underlay.org/ns/value": Schema.Coproduct<{
        "http://underlay.org/ns/reference": Schema.Reference<"http://underlay.org/ns/label">;
        "http://underlay.org/ns/uri": Schema.Product<{}>;
        "http://underlay.org/ns/literal": Schema.Uri;
        "http://underlay.org/ns/product": Schema.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/coproduct": Schema.Reference<"http://underlay.org/ns/coproduct">;
    }>;
}>;
export declare const product: Schema.Product<{}>;
export declare const component: Schema.Product<{
    "http://underlay.org/ns/key": Schema.Uri;
    "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/product">;
    "http://underlay.org/ns/value": Schema.Coproduct<{
        "http://underlay.org/ns/reference": Schema.Reference<"http://underlay.org/ns/label">;
        "http://underlay.org/ns/uri": Schema.Product<{}>;
        "http://underlay.org/ns/literal": Schema.Uri;
        "http://underlay.org/ns/product": Schema.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/coproduct": Schema.Reference<"http://underlay.org/ns/coproduct">;
    }>;
}>;
export declare const coproduct: Schema.Product<{}>;
export declare const option: Schema.Product<{
    "http://underlay.org/ns/key": Schema.Uri;
    "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/coproduct">;
    "http://underlay.org/ns/value": Schema.Coproduct<{
        "http://underlay.org/ns/reference": Schema.Reference<"http://underlay.org/ns/label">;
        "http://underlay.org/ns/uri": Schema.Product<{}>;
        "http://underlay.org/ns/literal": Schema.Uri;
        "http://underlay.org/ns/product": Schema.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/coproduct": Schema.Reference<"http://underlay.org/ns/coproduct">;
    }>;
}>;
declare const schemaSchema: Readonly<{
    "http://underlay.org/ns/label": Schema.Product<{
        "http://underlay.org/ns/key": Schema.Uri;
        "http://underlay.org/ns/value": Schema.Coproduct<{
            "http://underlay.org/ns/reference": Schema.Reference<"http://underlay.org/ns/label">;
            "http://underlay.org/ns/uri": Schema.Product<{}>;
            "http://underlay.org/ns/literal": Schema.Uri;
            "http://underlay.org/ns/product": Schema.Reference<"http://underlay.org/ns/product">;
            "http://underlay.org/ns/coproduct": Schema.Reference<"http://underlay.org/ns/coproduct">;
        }>;
    }>;
    "http://underlay.org/ns/product": Schema.Product<{}>;
    "http://underlay.org/ns/component": Schema.Product<{
        "http://underlay.org/ns/key": Schema.Uri;
        "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/value": Schema.Coproduct<{
            "http://underlay.org/ns/reference": Schema.Reference<"http://underlay.org/ns/label">;
            "http://underlay.org/ns/uri": Schema.Product<{}>;
            "http://underlay.org/ns/literal": Schema.Uri;
            "http://underlay.org/ns/product": Schema.Reference<"http://underlay.org/ns/product">;
            "http://underlay.org/ns/coproduct": Schema.Reference<"http://underlay.org/ns/coproduct">;
        }>;
    }>;
    "http://underlay.org/ns/coproduct": Schema.Product<{}>;
    "http://underlay.org/ns/option": Schema.Product<{
        "http://underlay.org/ns/key": Schema.Uri;
        "http://underlay.org/ns/source": Schema.Reference<"http://underlay.org/ns/coproduct">;
        "http://underlay.org/ns/value": Schema.Coproduct<{
            "http://underlay.org/ns/reference": Schema.Reference<"http://underlay.org/ns/label">;
            "http://underlay.org/ns/uri": Schema.Product<{}>;
            "http://underlay.org/ns/literal": Schema.Uri;
            "http://underlay.org/ns/product": Schema.Reference<"http://underlay.org/ns/product">;
            "http://underlay.org/ns/coproduct": Schema.Reference<"http://underlay.org/ns/coproduct">;
        }>;
    }>;
}>;
export declare type SchemaSchema = typeof schemaSchema;
export default schemaSchema;
