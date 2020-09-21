import { Store, Parse } from "n3.ts";
import { parse } from "./shex.js";
export const ns = {
    label: "http://underlay.org/ns/label",
    unit: "http://underlay.org/ns/unit",
    product: "http://underlay.org/ns/product",
    coproduct: "http://underlay.org/ns/coproduct",
    component: "http://underlay.org/ns/component",
    option: "http://underlay.org/ns/option",
    source: "http://underlay.org/ns/source",
    key: "http://underlay.org/ns/key",
    value: "http://underlay.org/ns/value",
    iri: "http://underlay.org/ns/iri",
    literal: "http://underlay.org/ns/literal",
    datatype: "http://underlay.org/ns/datatype",
    pattern: "http://underlay.org/ns/pattern",
    flags: "http://underlay.org/ns/flags",
};
export function parseSchemaString(input, schemaSchema) {
    const store = new Store(Parse(input));
    return parseSchema(store, schemaSchema);
}
export function parseSchema(store, schemaSchema) {
    const database = parse(store, schemaSchema);
    if (database._tag === "Left") {
        return database;
    }
    // types is indexed by iri key, not blank node label
    const dictionary = new Map();
    const types = new Map();
    for (const type of schemaSchema.values()) {
        if (type.type === "label") {
            const values = database.right.get(type.id);
            if (values === undefined) {
                throw new Error(`Cannot find ${type.id} in database`);
            }
            types.set(type.key, values);
            dictionary.set(type.key, type.id);
        }
    }
    const schema = new Map();
    const labels = types.get(ns.label);
    for (const { value: labelValue } of labels) {
        const { node: { id }, components: [keyValue, valueValue], } = labelValue;
        const { node: { value: key }, } = keyValue;
        const value = parseReference(valueValue, dictionary);
        schema.set(id, { id, type: "label", key, value: value.id });
    }
    const units = types.get(ns.unit);
    for (const { value: labelValue } of units) {
        const { node: { id }, } = labelValue;
        const unit = { id, type: "unit" };
        schema.set(id, unit);
    }
    const iris = types.get(ns.iri);
    for (const { value: labelValue } of iris) {
        const { value: optionValue } = labelValue;
        if (optionValue.type === "unit") {
            const { node: { id }, } = optionValue;
            schema.set(id, { id, type: "iri" });
        }
        else if (optionValue.type === "product") {
            const { node: { id }, components: [patternValue, flagsValue], } = optionValue;
            const { node: { value: pattern }, } = patternValue;
            const { node: { value: flags }, } = flagsValue;
            schema.set(id, { id, type: "iri", pattern, flags });
        }
        else {
            throw new Error("Invalid iri value");
        }
    }
    const literals = types.get(ns.literal);
    for (const { value: labelValue } of literals) {
        const { value: optionValue } = labelValue;
        if (optionValue.type === "product" && optionValue.components.length === 1) {
            const { node: { id }, components: [datatypeValue], } = optionValue;
            const { node: { value: datatype }, } = datatypeValue;
            schema.set(id, { id, type: "literal", datatype });
        }
        else if (optionValue.type === "product" &&
            optionValue.components.length === 3) {
            const { node: { id }, components: [datatypeValue, patternValue, flagsValue], } = optionValue;
            const { node: { value: datatype }, } = datatypeValue;
            const { node: { value: pattern }, } = patternValue;
            const { node: { value: flags }, } = flagsValue;
            schema.set(id, { id, type: "literal", datatype, pattern, flags });
        }
    }
    const products = types.get(ns.product);
    for (const { value: labelValue } of products) {
        const { node: { id }, } = labelValue;
        schema.set(id, { id, type: "product", components: [] });
    }
    const coproducts = types.get(ns.coproduct);
    for (const { value: labelValue } of coproducts) {
        const { node: { id }, } = labelValue;
        schema.set(id, { id, type: "coproduct", options: [] });
    }
    const components = types.get(ns.component);
    for (const { value: labelValue } of components) {
        const { components: [sourceValue, keyValue, valueValue], } = labelValue;
        const { value: sourceLabelValue } = sourceValue;
        const { node: { id }, } = sourceLabelValue;
        const { node: { value: key }, } = keyValue;
        const { id: value } = parseReference(valueValue, dictionary);
        const product = schema.get(id);
        product.components.push({ type: "component", key, value });
    }
    const options = types.get(ns.option);
    for (const { value: labelValue } of options) {
        const { components: [sourceValue, valueValue], } = labelValue;
        const { value: sourceLabelValue } = sourceValue;
        const { node: { id }, } = sourceLabelValue;
        const { id: value } = parseReference(valueValue, dictionary);
        const coproduct = schema.get(id);
        coproduct.options.push({ type: "option", value });
    }
    return { _tag: "Right", right: schema };
}
function parseReference(coproduct, dictionary) {
    const { value } = coproduct.value;
    if (coproduct.value.id === dictionary.get(ns.unit)) {
        const { node } = value;
        return node;
    }
    else if (coproduct.value.id === dictionary.get(ns.label)) {
        const { node } = value;
        return node;
    }
    else if (coproduct.value.id === dictionary.get(ns.iri)) {
        const { value: optionValue } = value;
        if (optionValue.type === "unit") {
            return optionValue.node;
        }
        else if (optionValue.type === "product") {
            return optionValue.node;
        }
        else {
            throw new Error("Invalid iri value option");
        }
    }
    else if (coproduct.value.id === dictionary.get(ns.literal)) {
        const { value: optionValue } = value;
        if (optionValue.type === "product") {
            return optionValue.node;
        }
        else {
            throw new Error("Invalid literal value option");
        }
    }
    else if (coproduct.value.id === dictionary.get(ns.product)) {
        const { node } = value;
        return node;
    }
    else if (coproduct.value.id === dictionary.get(ns.coproduct)) {
        const { node } = value;
        return node;
    }
    else {
        throw new Error("Invalid value option");
    }
}
//# sourceMappingURL=schema.js.map