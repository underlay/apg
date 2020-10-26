import t from "io-ts";
import { equal, forType, signalInvalidType, zip } from "./utils.js";
var APG;
(function (APG) {
    class Pointer {
        constructor(index) {
            this.index = index;
            Object.freeze(this);
        }
        get termType() {
            return "Pointer";
        }
    }
    APG.Pointer = Pointer;
    class Record extends Array {
        constructor(node, componentKeys, values) {
            super(...values);
            this.node = node;
            this.componentKeys = componentKeys;
            Object.freeze(this);
        }
        get termType() {
            return "Record";
        }
        get(key) {
            const index = this.componentKeys.indexOf(key);
            if (index === -1) {
                throw new Error("Key not found");
            }
            else {
                return this[index];
            }
        }
    }
    APG.Record = Record;
    class Variant {
        constructor(node, optionKeys, index, value) {
            this.node = node;
            this.optionKeys = optionKeys;
            this.index = index;
            this.value = value;
            Object.freeze(this);
        }
        get termType() {
            return "Variant";
        }
        get key() {
            return this.optionKeys[this.index];
        }
    }
    APG.Variant = Variant;
    function validateValue(value, type, schema) {
        if (type.type === "reference") {
            const label = schema[type.value];
            return validateValue(value, label.value, schema);
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
                for (const [k, v, { key, value }] of iter) {
                    if (k === key && validateValue(v, value, schema)) {
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
            if (value.termType === "Variant" && value.index < type.options.length) {
                const option = type.options[value.index];
                return validateValue(value.value, option.value, schema);
            }
            else {
                return false;
            }
        }
        else {
            signalInvalidType(type);
        }
    }
    APG.validateValue = validateValue;
    function validateMorphism(morphism, source, target, schema) {
        if (morphism.type === "constant") {
            return APG.validateValue(morphism.value, target, schema);
        }
        else if (morphism.type === "identity") {
            return equal(source, target);
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
            else if (morphism.morphisms.length !== target.components.length) {
                return false;
            }
            for (const [m, c] of zip(morphism.morphisms, target.components)) {
                if (validateMorphism(m, source, c.value, schema)) {
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
            else if (morphism.morphisms.length !== source.options.length) {
                return false;
            }
            for (const [m, o] of zip(morphism.morphisms, source.options)) {
                if (validateMorphism(m, o.value, target, schema)) {
                    continue;
                }
                else {
                    return false;
                }
            }
            return true;
        }
        else {
            throw new Error("Invalid morphism");
        }
    }
    APG.validateMorphism = validateMorphism;
    APG.reference = t.type({
        type: t.literal("reference"),
        value: t.number,
    });
    APG.unit = t.type({ type: t.literal("unit") });
    APG.iri = t.type({ type: t.literal("iri") });
    APG.literal = t.type({
        type: t.literal("literal"),
        datatype: t.string,
    });
    APG.product = t.recursion("Product", () => t.type({
        type: t.literal("product"),
        components: t.array(APG.component),
    }));
    APG.coproduct = t.recursion("Coproduct", () => t.type({
        type: t.literal("coproduct"),
        options: t.array(APG.option),
    }));
    APG.type = t.recursion("Type", () => t.union([APG.reference, APG.unit, APG.iri, APG.literal, APG.product, APG.coproduct]));
    APG.component = t.type({
        type: t.literal("component"),
        key: t.string,
        value: APG.type,
    });
    APG.option = t.type({
        type: t.literal("option"),
        key: t.string,
        value: APG.type,
    });
    APG.label = t.type({
        type: t.literal("label"),
        key: t.string,
        value: APG.type,
    });
    const labels = t.array(APG.label);
    APG.schema = new t.Type("Schema", labels.is, (input, context) => {
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
})(APG || (APG = {}));
export default APG;
//# sourceMappingURL=apg.js.map