import * as t from "io-ts";
import { forEntries, forType } from "@underlay/apg";
export const reference = t.type({
    kind: t.literal("reference"),
    value: t.string,
});
export const uri = t.type({ kind: t.literal("uri") });
export const literal = t.type({
    kind: t.literal("literal"),
    datatype: t.string,
});
export const product = t.recursion("Product", () => t.type({
    kind: t.literal("product"),
    components: t.record(t.string, type),
}));
export const coproduct = t.recursion("Coproduct", () => t.type({
    kind: t.literal("coproduct"),
    options: t.record(t.string, type),
}));
export const type = t.recursion("Type", () => t.union([reference, uri, literal, product, coproduct]));
const labels = t.record(t.string, type);
const codec = new t.Type("Schema", labels.is, (input, context) => {
    const result = labels.validate(input, context);
    if (result._tag === "Left") {
        return result;
    }
    // Check that references have valid referents
    for (const [_, label] of forEntries(result.right)) {
        for (const [type] of forType(label)) {
            if (type.kind === "reference") {
                if (type.value in result.right) {
                    continue;
                }
                else {
                    return t.failure(type, context, "Invalid reference");
                }
            }
        }
    }
    return result;
}, t.identity);
export default codec;
