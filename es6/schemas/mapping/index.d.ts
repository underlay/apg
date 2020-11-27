import APG from "../../apg.js";
import * as ns from "../../namespace.js";
declare const mappingSchema: {
    "http://underlay.org/ns/case": Readonly<{
        type: "product";
        components: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
    "http://underlay.org/ns/expression": Readonly<{
        type: "coproduct";
        options: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
    "http://underlay.org/ns/map": Readonly<{
        type: "product";
        components: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
    "http://underlay.org/ns/match": Readonly<{
        type: "unit";
    }>;
    "http://underlay.org/ns/path": Readonly<{
        type: "coproduct";
        options: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
    "http://underlay.org/ns/slot": Readonly<{
        type: "product";
        components: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
    "http://underlay.org/ns/tuple": Readonly<{
        type: "unit";
    }>;
};
export default mappingSchema;
