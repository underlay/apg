import APG from "../../apg.js";
import * as ns from "../../namespace.js";
export declare const value: APG.Coproduct;
export declare const label: APG.Product;
export declare const product: APG.Unit;
export declare const component: APG.Product;
export declare const coproduct: APG.Unit;
export declare const option: APG.Product;
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
