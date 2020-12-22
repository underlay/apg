import * as APG from "../../apg.js";
import * as ns from "../../namespace.js";
export declare const value: APG.Coproduct<{
    "http://underlay.org/ns/reference": APG.Reference<"http://underlay.org/ns/label">;
    "http://underlay.org/ns/uri": APG.Product<{}>;
    "http://underlay.org/ns/literal": APG.Uri;
    "http://underlay.org/ns/product": APG.Reference<"http://underlay.org/ns/product">;
    "http://underlay.org/ns/coproduct": APG.Reference<"http://underlay.org/ns/coproduct">;
}>;
export declare const label: APG.Product<{
    "http://underlay.org/ns/key": APG.Uri;
    "http://underlay.org/ns/value": APG.Coproduct<{
        "http://underlay.org/ns/reference": APG.Reference<"http://underlay.org/ns/label">;
        "http://underlay.org/ns/uri": APG.Product<{}>;
        "http://underlay.org/ns/literal": APG.Uri;
        "http://underlay.org/ns/product": APG.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/coproduct": APG.Reference<"http://underlay.org/ns/coproduct">;
    }>;
}>;
export declare const product: APG.Product<{}>;
export declare const component: APG.Product<{
    "http://underlay.org/ns/key": APG.Uri;
    "http://underlay.org/ns/source": APG.Reference<"http://underlay.org/ns/product">;
    "http://underlay.org/ns/value": APG.Coproduct<{
        "http://underlay.org/ns/reference": APG.Reference<"http://underlay.org/ns/label">;
        "http://underlay.org/ns/uri": APG.Product<{}>;
        "http://underlay.org/ns/literal": APG.Uri;
        "http://underlay.org/ns/product": APG.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/coproduct": APG.Reference<"http://underlay.org/ns/coproduct">;
    }>;
}>;
export declare const coproduct: APG.Product<{}>;
export declare const option: APG.Product<{
    "http://underlay.org/ns/key": APG.Uri;
    "http://underlay.org/ns/source": APG.Reference<"http://underlay.org/ns/coproduct">;
    "http://underlay.org/ns/value": APG.Coproduct<{
        "http://underlay.org/ns/reference": APG.Reference<"http://underlay.org/ns/label">;
        "http://underlay.org/ns/uri": APG.Product<{}>;
        "http://underlay.org/ns/literal": APG.Uri;
        "http://underlay.org/ns/product": APG.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/coproduct": APG.Reference<"http://underlay.org/ns/coproduct">;
    }>;
}>;
declare const schemaSchema: Readonly<{
    "http://underlay.org/ns/label": APG.Product<{
        "http://underlay.org/ns/key": APG.Uri;
        "http://underlay.org/ns/value": APG.Coproduct<{
            "http://underlay.org/ns/reference": APG.Reference<"http://underlay.org/ns/label">;
            "http://underlay.org/ns/uri": APG.Product<{}>;
            "http://underlay.org/ns/literal": APG.Uri;
            "http://underlay.org/ns/product": APG.Reference<"http://underlay.org/ns/product">;
            "http://underlay.org/ns/coproduct": APG.Reference<"http://underlay.org/ns/coproduct">;
        }>;
    }>;
    "http://underlay.org/ns/product": APG.Product<{}>;
    "http://underlay.org/ns/component": APG.Product<{
        "http://underlay.org/ns/key": APG.Uri;
        "http://underlay.org/ns/source": APG.Reference<"http://underlay.org/ns/product">;
        "http://underlay.org/ns/value": APG.Coproduct<{
            "http://underlay.org/ns/reference": APG.Reference<"http://underlay.org/ns/label">;
            "http://underlay.org/ns/uri": APG.Product<{}>;
            "http://underlay.org/ns/literal": APG.Uri;
            "http://underlay.org/ns/product": APG.Reference<"http://underlay.org/ns/product">;
            "http://underlay.org/ns/coproduct": APG.Reference<"http://underlay.org/ns/coproduct">;
        }>;
    }>;
    "http://underlay.org/ns/coproduct": APG.Product<{}>;
    "http://underlay.org/ns/option": APG.Product<{
        "http://underlay.org/ns/key": APG.Uri;
        "http://underlay.org/ns/source": APG.Reference<"http://underlay.org/ns/coproduct">;
        "http://underlay.org/ns/value": APG.Coproduct<{
            "http://underlay.org/ns/reference": APG.Reference<"http://underlay.org/ns/label">;
            "http://underlay.org/ns/uri": APG.Product<{}>;
            "http://underlay.org/ns/literal": APG.Uri;
            "http://underlay.org/ns/product": APG.Reference<"http://underlay.org/ns/product">;
            "http://underlay.org/ns/coproduct": APG.Reference<"http://underlay.org/ns/coproduct">;
        }>;
    }>;
}>;
export declare type SchemaSchema = typeof schemaSchema;
export default schemaSchema;
