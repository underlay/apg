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
        // Type values are units (unit, product, coproduct, maybe iri) or trees (reference, literal, maybe iri)
        schema.labels.set(label.node.value, {
            type: "label",
            key: key.value,
            value: parseID(value),
        });
    }
    for (const { value } of units) {
        schema.types.set(value, { type: "unit" });
    }
    for (const iri of iris) {
        if (iri.termType === "BlankNode") {
            schema.types.set(iri.value, { type: "iri" });
        }
        else if (iri.termType === "Tree") {
            const pattern = iri.get("iri-component-pattern");
            const flags = iri.get("iri-component-flags");
            schema.types.set(iri.node.value, {
                type: "iri",
                pattern: pattern.value,
                flags: flags.value,
            });
        }
        else {
            throw new Error("Invalid iri value");
        }
    }
    for (const literal of literals) {
        const datatype = literal.get("literal-without-pattern-component-datatype");
        if (datatype === undefined) {
            const datatype = literal.get("literal-with-pattern-component-datatype");
            const pattern = literal.get("literal-with-pattern-component-pattern");
            const flags = literal.get("literal-with-pattern-component-flags");
            schema.types.set(literal.node.value, {
                type: "literal",
                datatype: datatype.value,
                pattern: pattern.value,
                flags: flags.value,
            });
        }
        else if (datatype.termType === "NamedNode") {
            schema.types.set(literal.node.value, {
                type: "literal",
                datatype: datatype.value,
            });
        }
        else {
            throw new Error("Invalid literal value");
        }
    }
    for (const product of products) {
        schema.types.set(product.value, { type: "product", components: new Map() });
    }
    for (const coproduct of coproducts) {
        schema.types.set(coproduct.value, { type: "coproduct", options: new Map() });
    }
    const componentSourcePivot = pivotTree(components, "component-component-source");
    for (const [source, components] of componentSourcePivot) {
        const product = schema.types.get(source.value);
        if (product === undefined || product.type !== "product") {
            throw new Error("Invalid component source");
        }
        product.components = new Map(generateComponents(components));
    }
    const optionSourcePivot = pivotTree(options, "option-component-source");
    for (const [source, options] of optionSourcePivot) {
        const coproduct = schema.types.get(source.value);
        if (coproduct === undefined || coproduct.type !== "coproduct") {
            throw new Error("Invalid component source");
        }
        coproduct.options = new Map(generateOptions(options));
    }
    return { _tag: "Right", right: schema };
}
function parseID(value) {
    if (value.termType === "Tree") {
        const reference = value.get("reference-component-value");
        if (reference !== undefined) {
            if (reference.termType === "Tree") {
                return { type: "reference", value: reference.node.value };
            }
            else {
                throw new Error("Unexpected reference value");
            }
        }
        else {
            return value.node.value;
        }
    }
    else if (value.termType === "BlankNode") {
        return value.value;
    }
    else {
        throw new Error("Invalid id");
    }
}
function* generateComponents(components) {
    for (const component of components) {
        const key = component.get("component-component-key");
        const value = component.get("component-component-value");
        yield [
            component.node.value,
            { type: "component", key: key.value, value: parseID(value) },
        ];
    }
}
function* generateOptions(options) {
    for (const option of options) {
        const value = option.get("option-component-value");
        return [option.node.value, { type: "option", value: parseID(value) }];
    }
}
//# sourceMappingURL=schema.js.map