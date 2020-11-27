import APG from "../../apg.js";
import * as ns from "../../namespace.js";
declare const schemaSchema: {
    "http://underlay.org/ns/label": Readonly<{
        type: "product";
        components: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
    "http://underlay.org/ns/product": Readonly<{
        type: "unit";
    }>;
    "http://underlay.org/ns/component": Readonly<{
        type: "product";
        components: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
    "http://underlay.org/ns/coproduct": Readonly<{
        type: "unit";
    }>;
    "http://underlay.org/ns/option": Readonly<{
        type: "product";
        components: Readonly<{
            [key: string]: APG.Type;
        }>;
    }>;
};
export default schemaSchema;
