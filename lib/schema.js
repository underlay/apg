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
    const schema = new Map();
    const labels = database.right.get("_:label");
    for (const { value: labelValue } of labels) {
        const { node: { id }, components: [keyValue, valueValue], } = labelValue;
        const { node: { value: key }, } = keyValue;
        const value = parseReference(valueValue);
        schema.set(id, { id, type: "label", key, value: value.id });
    }
    const units = database.right.get("_:unit");
    for (const { value: labelValue } of units) {
        const { node: { id }, } = labelValue;
        const unit = { id, type: "unit" };
        schema.set(id, unit);
    }
    const iris = database.right.get("_:iri");
    for (const { value: labelValue } of iris) {
        const { option, value: optionValue } = labelValue;
        if (option === "_:iri-option-unit" && optionValue.type === "unit") {
            const { node: { id }, } = optionValue;
            schema.set(id, { id, type: "iri" });
        }
        else if (option === "_:iri-option-product" &&
            optionValue.type === "product") {
            const { node: { id }, components: [patternValue, flagsValue], } = optionValue;
            const { node: { value: pattern }, } = patternValue;
            const { node: { value: flags }, } = flagsValue;
            schema.set(id, { id, type: "iri", pattern, flags });
        }
        else {
            throw new Error("Invalid iri value");
        }
    }
    const literals = database.right.get("_:literal");
    for (const { value: labelValue } of literals) {
        const { option, value: optionValue } = labelValue;
        if (option === "_:literal-option-datatype" &&
            optionValue.type === "product") {
            const { node: { id }, components: [datatypeValue], } = optionValue;
            const { node: { value: datatype }, } = datatypeValue;
            schema.set(id, { id, type: "literal", datatype });
        }
        else if (option === "_:literal-option-pattern" &&
            optionValue.type === "product") {
            const { node: { id }, components: [datatypeValue, patternValue, flagsValue], } = optionValue;
            const { node: { value: datatype }, } = datatypeValue;
            const { node: { value: pattern }, } = patternValue;
            const { node: { value: flags }, } = flagsValue;
            schema.set(id, { id, type: "literal", datatype, pattern, flags });
        }
    }
    const products = database.right.get("_:product");
    for (const { value: labelValue } of products) {
        const { node: { id }, } = labelValue;
        schema.set(id, { id, type: "product", components: [] });
    }
    const coproducts = database.right.get("_:coproduct");
    for (const { value: labelValue } of coproducts) {
        const { node: { id }, } = labelValue;
        schema.set(id, { id, type: "coproduct", options: [] });
    }
    const components = database.right.get("_:component");
    for (const { value: labelValue } of components) {
        const { components: [sourceValue, keyValue, valueValue], } = labelValue;
        const { value: sourceLabelValue } = sourceValue;
        const { node: { id }, } = sourceLabelValue;
        const { node: { value: key }, } = keyValue;
        const { id: value } = parseReference(valueValue);
        const product = schema.get(id);
        product.components.push({ type: "component", key, value });
    }
    const options = database.right.get("_:option");
    for (const { value: labelValue } of options) {
        const { components: [sourceValue, valueValue], } = labelValue;
        const { value: sourceLabelValue } = sourceValue;
        const { node: { id }, } = sourceLabelValue;
        const { id: value } = parseReference(valueValue);
        const coproduct = schema.get(id);
        coproduct.options.push({ type: "option", value });
    }
    return { _tag: "Right", right: schema };
}
function parseReference(coproduct) {
    const { value } = coproduct.value;
    if (coproduct.option === "_:unit") {
        const { node } = value;
        return node;
    }
    else if (coproduct.option === "_:label") {
        const { node } = value;
        return node;
    }
    else if (coproduct.option === "_:iri") {
        const { option, value: optionValue } = value;
        if (option === "_:iri-option-unit") {
            const { node } = optionValue;
            return node;
        }
        else if (option === "_:iri-option-product") {
            const { node } = optionValue;
            return node;
        }
        else {
            throw new Error("Invalid iri value option");
        }
    }
    else if (coproduct.option === "_:literal") {
        const { option, value: optionValue } = value;
        if (option === "_:literal-option-datatype") {
            const { node } = optionValue;
            return node;
        }
        else if (option === "_:literal-option-pattern") {
            const { node } = optionValue;
            return node;
        }
        else {
            throw new Error("Invalid literal value option");
        }
    }
    else if (coproduct.option === "_:product") {
        const { node } = value;
        return node;
    }
    else if (coproduct.option === "_:coproduct") {
        const { node } = value;
        return node;
    }
    else {
        throw new Error("Invalid value option");
    }
}
//# sourceMappingURL=schema.js.map