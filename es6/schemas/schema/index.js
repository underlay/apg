import * as ns from "../../namespace.js";
import { freezeType, getEntries } from "../../utils.js";
const anyValue = {
    type: "coproduct",
    options: {
        [ns.reference]: { type: "reference", value: ns.label },
        [ns.unit]: { type: "unit" },
        [ns.uri]: { type: "unit" },
        [ns.literal]: { type: "uri" },
        [ns.product]: { type: "reference", value: ns.product },
        [ns.coproduct]: { type: "reference", value: ns.coproduct },
    },
};
// Label
const labelLabel = {
    type: "product",
    components: { [ns.key]: { type: "uri" }, [ns.value]: anyValue },
};
// Product
const productLabel = { type: "unit" };
// Component
const componentLabel = {
    type: "product",
    components: {
        [ns.key]: { type: "uri" },
        [ns.source]: { type: "reference", value: ns.product },
        [ns.value]: anyValue,
    },
};
// Coproduct
const coproductLabel = { type: "unit" };
// Option
const optionLabel = {
    type: "product",
    components: {
        [ns.key]: { type: "uri" },
        [ns.source]: { type: "reference", value: ns.coproduct },
        [ns.value]: anyValue,
    },
};
const schemaSchema = {
    [ns.label]: labelLabel,
    [ns.product]: productLabel,
    [ns.component]: componentLabel,
    [ns.coproduct]: coproductLabel,
    [ns.option]: optionLabel,
};
for (const [_, label] of getEntries(schemaSchema)) {
    freezeType(label);
}
Object.freeze(schemaSchema);
export default schemaSchema;
//# sourceMappingURL=index.js.map