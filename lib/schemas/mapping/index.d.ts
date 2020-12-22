import * as APG from "../../apg.js";
import * as ns from "../../namespace.js";
declare const mappingSchema: Readonly<{
    "http://underlay.org/ns/case": APG.Product<{
        "http://underlay.org/ns/key": APG.Uri;
        "http://underlay.org/ns/source": APG.Reference<"http://underlay.org/ns/match">;
        "http://underlay.org/ns/value": APG.Reference<"http://underlay.org/ns/expression">;
    }>;
    "http://underlay.org/ns/expression": APG.Coproduct<{
        "http://underlay.org/ns/constant": APG.Product<{
            "http://underlay.org/ns/datatype": APG.Uri;
            "http://underlay.org/ns/value": APG.Literal<"http://www.w3.org/2001/XMLSchema#string">;
        }>;
        "http://underlay.org/ns/dereference": APG.Uri;
        "http://underlay.org/ns/identifier": APG.Uri;
        "http://underlay.org/ns/identity": APG.Product<{}>;
        "http://underlay.org/ns/injection": APG.Uri;
        "http://underlay.org/ns/match": APG.Reference<"http://underlay.org/ns/match">;
        "http://underlay.org/ns/tuple": APG.Reference<"http://underlay.org/ns/tuple">;
    }>;
    "http://underlay.org/ns/map": APG.Product<{
        "http://underlay.org/ns/key": APG.Uri;
        "http://underlay.org/ns/source": APG.Uri;
        "http://underlay.org/ns/value": APG.Reference<"http://underlay.org/ns/expression">;
    }>;
    "http://underlay.org/ns/match": APG.Product<{}>;
    "http://underlay.org/ns/slot": APG.Product<{
        "http://underlay.org/ns/key": APG.Uri;
        "http://underlay.org/ns/source": APG.Reference<"http://underlay.org/ns/tuple">;
        "http://underlay.org/ns/value": APG.Reference<"http://underlay.org/ns/expression">;
    }>;
    "http://underlay.org/ns/tuple": APG.Product<{}>;
}>;
export default mappingSchema;
