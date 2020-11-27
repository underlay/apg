import { xsd } from "n3.ts";
import * as ns from "../../namespace.js";
// 0. case
const caseLabel = {
    type: "product",
    components: {
        [ns.key]: { type: "uri" },
        [ns.source]: { type: "reference", value: ns.match },
        [ns.value]: { type: "reference", value: ns.expression },
    },
};
// 1. expression
const expressionLabel = {
    type: "coproduct",
    options: {
        [ns.constant]: {
            type: "product",
            components: {
                [ns.datatype]: { type: "uri" },
                [ns.value]: { type: "literal", datatype: xsd.string },
            },
        },
        [ns.dereference]: { type: "uri" },
        [ns.identifier]: { type: "uri" },
        [ns.identity]: { type: "unit" },
        [ns.initial]: { type: "unit" },
        [ns.injection]: {
            type: "product",
            components: {
                [ns.key]: { type: "uri" },
                [ns.value]: { type: "reference", value: ns.expression },
            },
        },
        [ns.match]: { type: "reference", value: ns.match },
        [ns.projection]: { type: "uri" },
        [ns.terminal]: { type: "unit" },
        [ns.tuple]: { type: "reference", value: ns.tuple },
    },
};
// 2. map
const mapLabel = {
    type: "product",
    components: {
        [ns.key]: { type: "uri" },
        [ns.source]: { type: "uri" },
        [ns.target]: { type: "reference", value: ns.path },
        [ns.value]: { type: "reference", value: ns.expression },
    },
};
// 3. match
const matchLabel = { type: "unit" };
// 4. path
const pathLabel = {
    type: "coproduct",
    options: {
        [ns.none]: { type: "unit" },
        [ns.some]: {
            type: "product",
            components: {
                [ns.head]: {
                    type: "coproduct",
                    options: {
                        [ns.component]: { type: "uri" },
                        [ns.option]: { type: "uri" },
                    },
                },
                [ns.tail]: { type: "reference", value: ns.path },
            },
        },
    },
};
// 5. slot
const slotLabel = {
    type: "product",
    components: {
        [ns.key]: { type: "uri" },
        [ns.source]: { type: "reference", value: ns.tuple },
        [ns.value]: { type: "reference", value: ns.expression },
    },
};
// 6. tuple
const tupleLabel = { type: "unit" };
const mappingSchema = {
    [ns.CASE]: caseLabel,
    [ns.expression]: expressionLabel,
    [ns.map]: mapLabel,
    [ns.match]: matchLabel,
    [ns.path]: pathLabel,
    [ns.slot]: slotLabel,
    [ns.tuple]: tupleLabel,
};
export default mappingSchema;
//# sourceMappingURL=index.js.map