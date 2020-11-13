import * as t from "io-ts";
import { forType } from "../utils.js";
export const reference = t.type({
    type: t.literal("reference"),
    value: t.number,
});
export const unit = t.type({ type: t.literal("unit") });
export const iri = t.type({ type: t.literal("iri") });
export const literal = t.type({
    type: t.literal("literal"),
    datatype: t.string,
});
export const product = t.recursion("Product", () => t.type({
    type: t.literal("product"),
    components: t.array(component),
}));
export const coproduct = t.recursion("Coproduct", () => t.type({
    type: t.literal("coproduct"),
    options: t.array(option),
}));
export const type = t.recursion("Type", () => t.union([reference, unit, iri, literal, product, coproduct]));
export const component = t.type({
    type: t.literal("component"),
    key: t.string,
    value: type,
});
export const option = t.type({
    type: t.literal("option"),
    key: t.string,
    value: type,
});
export const label = t.type({
    type: t.literal("label"),
    key: t.string,
    value: type,
});
const labels = t.array(label);
const codec = new t.Type("Schema", labels.is, (input, context) => {
    const result = labels.validate(input, context);
    if (result._tag === "Left") {
        return result;
    }
    // Check that the label keys are sorted
    // (this also checks for duplicates)
    if (isSorted(result.right) === false) {
        return t.failure(result.right, context, "Labels must be sorted by key");
    }
    // Check that all the components and options are sorted,
    // and that references have valid indices
    for (const label of result.right) {
        for (const [type] of forType(label.value)) {
            if (type.type === "reference") {
                if (result.right[type.value] === undefined) {
                    return t.failure(type, context, "Invalid reference index");
                }
            }
            else if (type.type === "product") {
                if (isSorted(type.components) === false) {
                    return t.failure(type, context, "Product components must be sorted by key");
                }
            }
            else if (type.type === "coproduct") {
                if (isSorted(type.options) === false) {
                    return t.failure(type, context, "Coproduct options must be sorted by key");
                }
            }
        }
    }
    return result;
}, t.identity);
function isSorted(keys) {
    const result = keys.reduce((previous, { key }) => {
        if (previous === null) {
            return null;
        }
        else if (previous < key) {
            return key;
        }
        else {
            return null;
        }
    }, "");
    return result !== null;
}
export default codec;
//# sourceMappingURL=apg.js.map