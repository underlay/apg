import APG from "./apg.js";
import { signalInvalidType, zip } from "./utils.js";
export function validateMapping(mapping) {
    for (const [type, morphism] of zip(mapping.m1, mapping.m2)) {
        const source = fold(type, mapping);
        if (APG.validateMorphism(morphism, type, source, mapping.target)) {
            continue;
        }
        else {
            return false;
        }
    }
    return true;
}
function fold(type, mapping) {
    if (type.type === "reference") {
        const value = mapping.m1[type.value];
        if (value === undefined) {
            throw new Error("Invalid reference index");
        }
        else {
            return value;
        }
    }
    else if (type.type === "unit") {
        return type;
    }
    else if (type.type === "iri") {
        return type;
    }
    else if (type.type === "literal") {
        return type;
    }
    else if (type.type === "product") {
        const components = [];
        for (const { key, value } of type.components) {
            components.push(Object.freeze({ type: "component", key, value: fold(value, mapping) }));
        }
        Object.freeze(components);
        return Object.freeze({ type: "product", components });
    }
    else if (type.type === "coproduct") {
        const options = [];
        for (const { key, value } of type.options) {
            options.push(Object.freeze({ type: "option", key, value: fold(value, mapping) }));
        }
        Object.freeze(options);
        return Object.freeze({ type: "coproduct", options });
    }
    else {
        signalInvalidType(type);
    }
}
//# sourceMappingURL=mapping.js.map