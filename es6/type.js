import zip from "ziterable";
export function* forType(type, stack) {
    if (stack === undefined) {
        stack = [];
    }
    else if (stack.includes(type)) {
        throw new Error("Recursive type");
    }
    yield [type, stack];
    if (type.type === "product") {
        stack.push(type);
        for (const { value } of type.components) {
            yield* forType(value, stack);
        }
        stack.pop();
    }
    else if (type.type === "coproduct") {
        stack.push(type);
        for (const { value } of type.options) {
            yield* forType(value, stack);
        }
        stack.pop();
    }
}
export function isTypeEqual(a, b) {
    if (a === b) {
        return true;
    }
    else if (a.type !== b.type) {
        return false;
    }
    else if (a.type === "reference" && b.type === "reference") {
        return a.value === b.value;
    }
    else if (a.type === "unit" && b.type === "unit") {
        return true;
    }
    else if (a.type === "iri" && b.type === "iri") {
        return true;
    }
    else if (a.type === "literal" && b.type === "literal") {
        return a.datatype === b.datatype;
    }
    else if (a.type === "product" && b.type === "product") {
        if (a.components.length !== b.components.length) {
            return false;
        }
        for (const [A, B] of zip(a.components, b.components)) {
            if (A.key !== B.key) {
                return false;
            }
            else if (isTypeEqual(A.value, B.value)) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else if (a.type === "coproduct" && b.type === "coproduct") {
        if (a.options.length !== b.options.length) {
            return false;
        }
        for (const [A, B] of zip(a.options, b.options)) {
            if (A.key !== B.key) {
                return false;
            }
            else if (isTypeEqual(A.value, B.value)) {
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
    else if (a.type !== b.type) {
        return false;
    }
    else if (a.type === "reference" && b.type === "reference") {
        return a.value === b.value;
    }
    else if (a.type === "unit" && b.type === "unit") {
        return true;
    }
    else if (a.type === "iri" && b.type === "iri") {
        return true;
    }
    else if (a.type === "literal" && b.type === "literal") {
        return a.datatype === b.datatype;
    }
    else if (a.type === "product" && b.type === "product") {
        for (const { key, value } of b.components) {
            const source = a.components.find((component) => key === component.key);
            if (source === undefined) {
                return false;
            }
            else if (isTypeAssignable(source.value, value)) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else if (a.type === "coproduct" && b.type === "coproduct") {
        for (const { key, value } of a.options) {
            const target = b.options.find((option) => key === option.key);
            if (target === undefined) {
                return false;
            }
            else if (isTypeAssignable(value, target.value)) {
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
    else if (a.type === "reference" && b.type === "reference") {
        if (a.value === b.value) {
            return b;
        }
    }
    else if (a.type === "unit" && b.type === "unit") {
        return b;
    }
    else if (a.type === "iri" && b.type === "iri") {
        return b;
    }
    else if (a.type === "literal" && b.type === "literal") {
        if (a.datatype === b.datatype) {
            return b;
        }
    }
    else if (a.type === "product" && b.type === "product") {
        const components = Array.from(unifyComponents(a, b));
        Object.freeze(components);
        return Object.freeze({ type: "product", components });
    }
    if (a.type === "coproduct" && b.type === "coproduct") {
        const options = Array.from(unifyOptions(a, b));
        Object.freeze(options);
        return Object.freeze({ type: "coproduct", options });
    }
    else {
        throw new Error("Cannot unify unequal types");
    }
}
function* unifyComponents(a, b) {
    if (a.components.length !== b.components.length) {
        throw new Error("Cannot unify unequal types");
    }
    for (const [A, B] of zip(a.components, b.components)) {
        if (A.key !== B.key) {
            throw new Error("Cannot unify unequal types");
        }
        else {
            yield Object.freeze({
                type: "component",
                key: B.key,
                value: unify(A.value, B.value),
            });
        }
    }
}
function* unifyOptions(a, b) {
    const aKeys = new Map(a.options.map(({ key, value }) => [key, value]));
    const bKeys = new Map(b.options.map(({ key, value }) => [key, value]));
    const keys = Array.from(new Set([...aKeys.keys(), ...bKeys.keys()])).sort();
    for (const key of keys) {
        const A = aKeys.get(key);
        const B = bKeys.get(key);
        if (A !== undefined && B === undefined) {
            yield Object.freeze({ type: "option", key, value: A });
        }
        else if (A === undefined && B !== undefined) {
            yield Object.freeze({ type: "option", key, value: B });
        }
        else if (A !== undefined && B !== undefined) {
            yield Object.freeze({ type: "option", key, value: unify(A, B) });
        }
        else {
            throw new Error("Error unifying options");
        }
    }
}
//# sourceMappingURL=type.js.map