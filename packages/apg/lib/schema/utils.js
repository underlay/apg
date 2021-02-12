import * as Schema from "./schema.js";
import { getKeys, zip } from "../utils.js";
export function* forType(type, stack = []) {
    if (stack.includes(type)) {
        throw new Error("Recursive type");
    }
    yield [type, stack];
    if (type.kind === "product") {
        stack.push(type);
        for (const key of getKeys(type.components)) {
            yield* forType(type.components[key], stack);
        }
        stack.pop();
    }
    else if (type.kind === "coproduct") {
        stack.push(type);
        for (const key of getKeys(type.options)) {
            yield* forType(type.options[key], stack);
        }
        stack.pop();
    }
}
export function isTypeEqual(a, b) {
    if (a === b) {
        return true;
    }
    else if (a.kind !== b.kind) {
        return false;
    }
    else if (a.kind === "reference" && b.kind === "reference") {
        return a.value === b.value;
    }
    else if (a.kind === "uri" && b.kind === "uri") {
        return true;
    }
    else if (a.kind === "literal" && b.kind === "literal") {
        return a.datatype === b.datatype;
    }
    else if (a.kind === "product" && b.kind === "product") {
        const A = getKeys(a.components);
        const B = getKeys(b.components);
        if (A.length !== B.length) {
            return false;
        }
        for (const [keyA, keyB] of zip(A, B)) {
            if (keyA !== keyB) {
                return false;
            }
            else if (isTypeEqual(a.components[keyA], a.components[keyB])) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else if (a.kind === "coproduct" && b.kind === "coproduct") {
        const A = getKeys(a.options);
        const B = getKeys(b.options);
        if (A.length !== B.length) {
            return false;
        }
        for (const [keyA, keyB] of zip(A, B)) {
            if (keyA !== keyB) {
                return false;
            }
            else if (isTypeEqual(a.options[keyA], b.options[keyB])) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
}
export function isTypeAssignable(a, b) {
    if (a === b) {
        return true;
    }
    else if (a.kind !== b.kind) {
        return false;
    }
    else if (a.kind === "reference" && b.kind === "reference") {
        return a.value === b.value;
    }
    else if (a.kind === "uri" && b.kind === "uri") {
        return true;
    }
    else if (a.kind === "literal" && b.kind === "literal") {
        return a.datatype === b.datatype;
    }
    else if (a.kind === "product" && b.kind === "product") {
        for (const key of getKeys(b.components)) {
            if (key in a.components &&
                isTypeAssignable(a.components[key], b.components[key])) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else if (a.kind === "coproduct" && b.kind === "coproduct") {
        for (const key of getKeys(a.options)) {
            if (key in b.options &&
                isTypeAssignable(a.options[key], b.options[key])) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
}
export function unify(a, b) {
    if (a === b) {
        return b;
    }
    else if (a.kind === "reference" && b.kind === "reference") {
        if (a.value === b.value) {
            return b;
        }
    }
    else if (a.kind === "uri" && b.kind === "uri") {
        return b;
    }
    else if (a.kind === "literal" && b.kind === "literal") {
        if (a.datatype === b.datatype) {
            return b;
        }
    }
    else if (a.kind === "product" && b.kind === "product") {
        return Schema.product(Object.fromEntries(unifyComponents(a, b)));
    }
    if (a.kind === "coproduct" && b.kind === "coproduct") {
        return Schema.coproduct(Object.fromEntries(unifyOptions(a, b)));
    }
    else {
        throw new Error("Cannot unify unequal types");
    }
}
function* unifyComponents(a, b) {
    const A = getKeys(a.components);
    const B = getKeys(b.components);
    if (A.length !== B.length) {
        throw new Error("Cannot unify unequal products");
    }
    for (const [keyA, keyB] of zip(A, B)) {
        if (keyA !== keyB) {
            throw new Error("Cannot unify unequal types");
        }
        else {
            yield [keyA, unify(a.components[keyA], b.components[keyB])];
        }
    }
}
function* unifyOptions(a, b) {
    const keys = Array.from(new Set([...getKeys(a.options), ...getKeys(b.options)])).sort();
    for (const key of keys) {
        const A = a.options[key];
        const B = b.options[key];
        if (A !== undefined && B === undefined) {
            yield [key, A];
        }
        else if (A === undefined && B !== undefined) {
            yield [key, B];
        }
        else if (A !== undefined && B !== undefined) {
            yield [key, unify(A, B)];
        }
        else {
            throw new Error("Error unifying options");
        }
    }
}
