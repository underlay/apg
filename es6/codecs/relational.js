import * as t from "io-ts";
import { ns } from "../index.js";
import { forEntries } from "../utils.js";
const property = t.union([
    t.type({ type: t.literal("reference"), value: t.string }),
    t.type({ type: t.literal("literal"), datatype: t.string }),
    t.type({ type: t.literal("uri") }),
]);
const optionalProperty = t.union([
    property,
    t.type({
        type: t.literal("coproduct"),
        options: t.type({
            [ns.none]: t.type({ type: t.literal("unit") }),
            [ns.some]: property,
        }),
    }),
]);
const type = t.union([
    t.type({ type: t.literal("unit") }),
    t.type({
        type: t.literal("product"),
        components: t.record(t.string, optionalProperty),
    }),
]);
const labels = t.record(t.string, type);
const isProperty = (type) => type.type === "reference" || type.type === "uri" || type.type === "literal";
const isOptionalProperty = (type) => isProperty(type) ||
    (type.type === "coproduct" &&
        ns.none in type.options &&
        type.options[ns.none].type === "unit" &&
        ns.some in type.options &&
        isProperty(type.options[ns.some]));
export function isRelationalSchema(input) {
    for (const [key, type] of forEntries(input)) {
        if (type.type === "unit") {
            continue;
        }
        else if (type.type === "product") {
            for (const [_, value] of forEntries(type.components)) {
                if (isOptionalProperty(value)) {
                    continue;
                }
                else {
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }
    return true;
}
export const relationalSchema = new t.Type("Relational", (input) => {
    return labels.is(input);
}, (input, context) => {
    if (isRelationalSchema(input)) {
        return t.success(input);
    }
    else {
        return t.failure(input, context);
    }
}, t.identity);
//# sourceMappingURL=relational.js.map