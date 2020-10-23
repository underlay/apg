import * as N3 from "n3.ts";
import { parse } from "./shex.js";
import { rotateTree } from "./utils.js";
import * as ns from "./namespace.js";
import schemaSchema from "./bootstrap.js";
export function parseSchemaString(input) {
    const store = new N3.Store(N3.Parse(input));
    return parseSchema(store);
}
export function parseSchema(store) {
    const result = parse(store, schemaSchema);
    if (result._tag === "Left") {
        return result;
    }
    const database = new Map(schemaSchema.map((label, index) => [label.key, result.right[index]]));
    const labels = database.get(ns.label);
    const components = database.get(ns.component);
    const options = database.get(ns.option);
    const componentSources = rotateTree(components, ns.source);
    const optionSources = rotateTree(options, ns.source);
    const typeCache = new Map(schemaSchema.map(({ key }) => [key, new Map()]));
    const sortedLabels = labels.slice().sort((a, b) => {
        const { value: A } = a.get(ns.key);
        const { value: B } = b.get(ns.key);
        return A < B ? -1 : B < A ? 1 : 0;
    });
    const permutation = labels.map((label) => sortedLabels.indexOf(label));
    const schema = sortedLabels.map((label) => {
        const { value: key } = label.get(ns.key);
        const target = label.get(ns.value);
        const value = parseValue(target, database, typeCache, componentSources, optionSources, permutation);
        return Object.freeze({ type: "label", key, value });
    });
    Object.freeze(schema);
    return { _tag: "Right", right: schema };
}
function parseValue(value, database, typeCache, componentSources, optionSources, permutation) {
    const { index } = value.value;
    // const { index } = record.get(ns.value) as APG.Pointer
    const key = value.key;
    const cache = typeCache.get(key);
    if (cache.has(index)) {
        return cache.get(index);
    }
    else if (key === ns.reference) {
        const reference = database.get(ns.reference)[index];
        return parseReference(index, reference, typeCache, permutation);
    }
    else if (key === ns.unit) {
        return parseUnit(index, typeCache);
    }
    else if (key === ns.iri) {
        return parseIri(index, typeCache);
    }
    else if (key === ns.literal) {
        const literal = database.get(ns.literal)[index];
        return parseLiteral(index, literal, typeCache);
    }
    else if (key === ns.product) {
        return parseProduct(index, database, typeCache, componentSources, optionSources, permutation);
    }
    else if (key === ns.coproduct) {
        return parseCoproduct(index, database, typeCache, componentSources, optionSources, permutation);
    }
    else {
        throw new Error(`Invalid value variant key ${key}`);
    }
}
function parseReference(index, value, typeCache, permutation) {
    const target = value.get(ns.value);
    const reference = Object.freeze({
        type: "reference",
        value: permutation[target.index],
    });
    typeCache.get(ns.reference).set(index, reference);
    return reference;
}
function parseUnit(index, typeCache) {
    const unit = Object.freeze({ type: "unit" });
    typeCache.get(ns.unit).set(index, unit);
    return unit;
}
function parseIri(index, typeCache) {
    const iri = Object.freeze({ type: "iri" });
    typeCache.get(ns.iri).set(index, iri);
    return iri;
}
function parseLiteral(index, value, typeCache) {
    const { value: datatype } = value.get(ns.datatype);
    const literal = Object.freeze({ type: "literal", datatype });
    typeCache.get(ns.literal).set(index, literal);
    return literal;
}
function parseProduct(index, database, typeCache, componentSources, optionSources, permutation) {
    const components = [];
    for (const component of componentSources.get(index) || []) {
        const { value: key } = component.get(ns.key);
        const value = parseValue(component.get(ns.value), database, typeCache, componentSources, optionSources, permutation);
        components.push({ type: "component", key, value });
    }
    Object.freeze(components.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0)));
    const product = Object.freeze({ type: "product", components });
    typeCache.get(ns.product).set(index, product);
    return product;
}
function parseCoproduct(index, database, typeCache, componentSources, optionSources, permutation) {
    const options = [];
    for (const option of optionSources.get(index) || []) {
        const { value: key } = option.get(ns.key);
        const value = parseValue(option.get(ns.value), database, typeCache, componentSources, optionSources, permutation);
        options.push({ type: "option", key, value });
    }
    Object.freeze(options.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0)));
    const coproduct = Object.freeze({ type: "coproduct", options });
    typeCache.get(ns.coproduct).set(index, coproduct);
    return coproduct;
}
//# sourceMappingURL=schema.js.map