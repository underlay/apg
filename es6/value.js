import zip from "ziterable";
import APG from "./apg.js";
import { forEntries, getKeys } from "./utils.js";
export function validateInstance(schema, instance) {
    const iter = zip(forEntries(schema), forEntries(instance));
    for (const [[k1, type], [k2, values]] of iter) {
        if (k1 !== k2) {
            return false;
        }
        for (const value of values) {
            if (validateValue(type, value)) {
                continue;
            }
            else {
                return false;
            }
        }
    }
    return true;
}
export function validateValue(type, value) {
    if (APG.isReference(type)) {
        return value.termType === "Pointer";
    }
    else if (APG.isUri(type)) {
        return value.termType === "NamedNode";
    }
    else if (APG.isLiteral(type)) {
        return APG.isLiteralValue(value) && value.datatype.value === type.datatype;
    }
    else if (APG.isProduct(type)) {
        if (APG.isRecord(value)) {
            const keys = getKeys(type.components);
            if (keys.length !== value.length) {
                return false;
            }
            for (const [k1, k2, v] of zip(keys, value.components, value)) {
                if (k1 !== k2) {
                    return false;
                }
                else if (validateValue(type.components[k1], v)) {
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
    else if (APG.isCoproduct(type)) {
        if (APG.isVariant(value) && value.key in type.options) {
            return validateValue(type.options[value.key], value.value);
        }
        else {
            return false;
        }
    }
    else {
        console.error(type);
        throw new Error("Unexpected type");
    }
}
export function* forValue(value, stack = []) {
    if (stack.includes(value)) {
        throw new Error("Recursive type");
    }
    yield [value, stack];
    if (value.termType === "Record") {
        stack.push(value);
        for (const leaf of value) {
            yield* forValue(leaf, stack);
        }
        stack.pop();
    }
    else if (value.termType === "Variant") {
        stack.push(value);
        yield* forValue(value.value, stack);
        stack.pop();
    }
}
//# sourceMappingURL=value.js.map