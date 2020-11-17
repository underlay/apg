import zip from "ziterable";
import { signalInvalidType } from "./utils.js";
export function validateValue(type, value) {
    if (type.type === "reference") {
        return value.termType === "Pointer";
    }
    else if (type.type === "unit") {
        return value.termType === "BlankNode";
    }
    else if (type.type === "iri") {
        return value.termType === "NamedNode";
    }
    else if (type.type === "literal") {
        return (value.termType === "Literal" && value.datatype.value === type.datatype);
    }
    else if (type.type === "product") {
        if (value.termType === "Record" &&
            value.length === type.components.length) {
            const iter = zip(value.componentKeys, value, type.components);
            for (const [k, v, { key, value: t }] of iter) {
                if (k === key && validateValue(t, v)) {
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
    else if (type.type === "coproduct") {
        if (value.termType === "Variant") {
            const option = type.options.find(({ key }) => key === value.key);
            return option !== undefined && validateValue(option.value, value.value);
        }
        else {
            return false;
        }
    }
    else {
        signalInvalidType(type);
    }
}
export function* forValue(value) {
    yield [value];
    if (value.termType === "Record") {
        for (const leaf of value) {
            yield* forValue(leaf);
        }
    }
    else if (value.termType === "Variant") {
        yield* forValue(value.value);
    }
}
//# sourceMappingURL=value.js.map