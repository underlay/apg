import zip from "ziterable";
import { equal, signalInvalidType } from "./utils.js";
import { validateValue } from "./value.js";
export function validateMorphism(morphism, source, target, schema) {
    if (morphism.type === "constant") {
        return validateValue(morphism.value, target, schema);
    }
    else if (morphism.type === "dereference") {
        return (source.type === "reference" && equal(schema[source.value].value, target));
    }
    else if (morphism.type === "identity") {
        return equal(source, target);
    }
    else if (morphism.type === "initial") {
        return false; // TODO
    }
    else if (morphism.type === "terminal") {
        return target.type === "unit";
    }
    else if (morphism.type === "composition") {
        const [AB, BC] = morphism.morphisms;
        return (validateMorphism(AB, source, morphism.object, schema) &&
            validateMorphism(BC, morphism.object, target, schema));
    }
    else if (morphism.type === "projection") {
        if (source.type !== "product") {
            return false;
        }
        else if (morphism.index >= source.components.length) {
            return false;
        }
        const { value } = source.components[morphism.index];
        return equal(value, target);
    }
    else if (morphism.type === "injection") {
        if (target.type !== "coproduct") {
            return false;
        }
        else if (morphism.index >= target.options.length) {
            return false;
        }
        const { value } = target.options[morphism.index];
        return equal(source, value);
    }
    else if (morphism.type === "tuple") {
        if (target.type !== "product") {
            return false;
        }
        const { morphisms, componentKeys } = morphism;
        const { components } = target;
        if (morphisms.length !== components.length ||
            componentKeys.length !== components.length) {
            return false;
        }
        for (const [k, m, c] of zip(componentKeys, morphisms, components)) {
            if (k === c.key && validateMorphism(m, source, c.value, schema)) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else if (morphism.type === "case") {
        if (source.type !== "coproduct") {
            return false;
        }
        const { morphisms, optionKeys } = morphism;
        const { options } = source;
        if (morphisms.length !== options.length ||
            optionKeys.length !== options.length) {
            return false;
        }
        for (const [k, m, o] of zip(optionKeys, morphisms, options)) {
            if (k === o.key && validateMorphism(m, o.value, target, schema)) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else {
        signalInvalidType(morphism);
    }
}
//# sourceMappingURL=morphism.js.map