import { Store, Parse } from "n3.ts";
import { parse } from "./shex.js";
import { pivotTree } from "./utils.js";
export const ns = {
    label: "http://underlay.org/ns/label",
    reference: "http://underlay.org/ns/reference",
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
    const schema = { labels: new Map(), types: new Map() };
    const labels = database.right.get("label");
    const units = database.right.get("unit");
    const iris = database.right.get("iri");
    const literals = database.right.get("literal");
    const products = database.right.get("product");
    const components = database.right.get("component");
    const coproducts = database.right.get("coproduct");
    const options = database.right.get("option");
    for (const label of labels) {
        const key = label.get("label-component-key");
        const value = label.get("label-component-value");
        // Okay this is for sure some value, but to form good JSON
        // we need to figure out it it's a reference or not.
        // Type values are units (unit, product, coproduct, iri) or products (reference, literal)
        schema.labels.set(label.node.value, Object.freeze({
            type: "label",
            key: key.value,
            value: parseID(value),
        }));
    }
    for (const { value } of units) {
        schema.types.set(value, Object.freeze({ type: "unit" }));
    }
    for (const iri of iris) {
        if (iri.termType === "BlankNode") {
            schema.types.set(iri.value, Object.freeze({ type: "iri" }));
        }
        else {
            throw new Error("Invalid iri value");
        }
    }
    for (const literal of literals) {
        const datatype = literal.get("literal-component-datatype");
        if (datatype.termType === "NamedNode") {
            schema.types.set(literal.node.value, Object.freeze({
                type: "literal",
                datatype: datatype.value,
            }));
        }
        else {
            throw new Error("Invalid literal value");
        }
    }
    for (const coproduct of coproducts) {
        schema.types.set(coproduct.value, { type: "coproduct", options: new Map() });
    }
    const componentSourcePivot = pivotTree(components, "component-component-source");
    for (const [source, components] of componentSourcePivot) {
        if (products.has(source)) {
            schema.types.set(source.value, Object.freeze({
                type: "product",
                components: new Map(generateComponents(components)),
            }));
        }
        else {
            throw new Error("Invalid component source");
        }
    }
    for (const product of products) {
        if (!schema.types.has(product.value)) {
            schema.types.set(product.value, Object.freeze({
                type: "product",
                components: new Map(),
            }));
        }
    }
    const optionSourcePivot = pivotTree(options, "option-component-source");
    for (const [source, options] of optionSourcePivot) {
        if (coproducts.has(source)) {
            schema.types.set(source.value, Object.freeze({
                type: "coproduct",
                options: new Map(generateOptions(options)),
            }));
        }
        else {
            throw new Error("Invalid component source");
        }
    }
    for (const coproduct of coproducts) {
        if (!schema.types.has(coproduct.value)) {
            schema.types.set(coproduct.value, Object.freeze({
                type: "coproduct",
                options: new Map(),
            }));
        }
    }
    return { _tag: "Right", right: schema };
}
function parseID(value) {
    if (value.option === "value-option-reference") {
        if (value.value.termType === "Product") {
            const label = value.value.get("reference-component-value");
            if (label !== undefined && label.termType === "Product") {
                return Object.freeze({ type: "reference", value: label.node.value });
            }
            else {
                throw new Error("Invalid label value");
            }
        }
        else {
            throw new Error("Invalid reference value");
        }
    }
    else if (value.value.termType === "BlankNode") {
        return value.value.value;
    }
    else if (value.value.termType === "Product") {
        return value.value.node.value;
    }
    else {
        throw new Error("Invalid value");
    }
}
function* generateComponents(components) {
    for (const component of components) {
        const key = component.get("component-component-key");
        const value = component.get("component-component-value");
        yield [
            component.node.value,
            Object.freeze({
                type: "component",
                key: key.value,
                value: parseID(value),
            }),
        ];
    }
}
function* generateOptions(options) {
    for (const option of options) {
        const value = option.get("option-component-value");
        const key = option.get("option-component-key");
        yield [
            option.node.value,
            Object.freeze({
                type: "option",
                key: key.value,
                value: parseID(value),
            }),
        ];
    }
}
//# sourceMappingURL=schema.js.map