import * as Schema from "../schema/schema.js";
import { signalInvalidType, forEntries, mapKeys } from "../utils.js";
import { validateExpressions } from "./apply.js";
export function validateMapping(M, S, T) {
    for (const [key, type] of forEntries(S)) {
        if (!(key in M)) {
            return false;
        }
        const { source, value } = M[key];
        if (validateExpressions(S, value, T[source], fold(M, S, T, type))) {
            continue;
        }
        else {
            return false;
        }
    }
    return true;
}
export function fold(M, S, T, type) {
    if (type.kind === "reference") {
        const { source } = M[type.value];
        const value = T[source];
        if (value === undefined) {
            throw new Error("Invalid reference index");
        }
        else {
            return value;
        }
    }
    else if (type.kind === "uri") {
        return type;
    }
    else if (type.kind === "literal") {
        return type;
    }
    else if (type.kind === "product") {
        return Schema.product(mapKeys(type.components, (value) => fold(M, S, T, value)));
    }
    else if (type.kind === "coproduct") {
        return Schema.coproduct(mapKeys(type.options, (value) => fold(M, S, T, value)));
    }
    else {
        signalInvalidType(type);
    }
}
