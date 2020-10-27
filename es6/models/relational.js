import * as t from "io-ts";
import { none, some } from "../namespace.js";
const property = t.union([
    t.type({ type: t.literal("reference"), value: t.number }),
    t.type({ type: t.literal("literal"), datatype: t.string }),
    t.type({ type: t.literal("iri") }),
]);
const optionalProperty = t.union([
    property,
    t.type({
        type: t.literal("coproduct"),
        options: t.tuple([
            t.type({
                type: t.literal("option"),
                key: t.literal(none),
                value: t.type({ type: t.literal("unit") }),
            }),
            t.type({
                type: t.literal("option"),
                key: t.literal(some),
                value: property,
            }),
        ]),
    }),
]);
const type = t.union([
    t.type({ type: t.literal("unit") }),
    t.type({
        type: t.literal("product"),
        components: t.array(t.type({
            type: t.literal("component"),
            key: t.string,
            value: optionalProperty,
        })),
    }),
]);
const label = t.type({ type: t.literal("label"), key: t.string, value: type });
const labels = t.array(label);
const isProperty = (type) => type.type === "reference" || type.type === "iri" || type.type === "literal";
function isOptionalProperty(type) {
    if (isProperty(type)) {
        return true;
    }
    else if (type.type === "coproduct" && type.options.length === 2) {
        const [first, second] = type.options;
        return (first.key === none &&
            first.value.type === "unit" &&
            second.key === some &&
            isProperty(second.value));
    }
    else {
        return false;
    }
}
export function isRelationalSchema(input) {
    for (const label of input) {
        if (label.value.type === "unit") {
            continue;
        }
        else if (label.value.type === "product") {
            for (const component of label.value.components) {
                if (isOptionalProperty(component.value)) {
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