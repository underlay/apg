import * as N3 from "n3.ts";
import APG from "../../apg.js";
import schemaSchema from "./index.js";
import * as ns from "../../namespace.js";
import { getID, signalInvalidType } from "../../utils.js";
export function toSchema(instance) {
    if (instance.length !== schemaSchema.length) {
        throw new Error("Invalid schema schema instance");
    }
    const database = new Map(schemaSchema.map((label, index) => [label.key, instance[index]]));
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
        const value = toValue(target, database, typeCache, componentSources, optionSources, permutation);
        return Object.freeze({ type: "label", key, value });
    });
    Object.freeze(schema);
    return schema;
}
function toValue(value, database, typeCache, componentSources, optionSources, permutation) {
    const { index } = value.value;
    const key = value.key;
    const cache = typeCache.get(key);
    if (cache.has(index)) {
        return cache.get(index);
    }
    else if (key === ns.reference) {
        const reference = database.get(ns.reference)[index];
        return toReference(index, reference, typeCache, permutation);
    }
    else if (key === ns.unit) {
        return toUnit(index, typeCache);
    }
    else if (key === ns.iri) {
        return toIri(index, typeCache);
    }
    else if (key === ns.literal) {
        const literal = database.get(ns.literal)[index];
        return toLiteral(index, literal, typeCache);
    }
    else if (key === ns.product) {
        return toProduct(index, database, typeCache, componentSources, optionSources, permutation);
    }
    else if (key === ns.coproduct) {
        return toCoproduct(index, database, typeCache, componentSources, optionSources, permutation);
    }
    else {
        throw new Error(`Invalid value variant key ${key}`);
    }
}
function toReference(index, value, typeCache, permutation) {
    const target = value.get(ns.value);
    const reference = Object.freeze({
        type: "reference",
        value: permutation[target.index],
    });
    typeCache.get(ns.reference).set(index, reference);
    return reference;
}
function toUnit(index, typeCache) {
    const unit = Object.freeze({ type: "unit" });
    typeCache.get(ns.unit).set(index, unit);
    return unit;
}
function toIri(index, typeCache) {
    const iri = Object.freeze({ type: "iri" });
    typeCache.get(ns.iri).set(index, iri);
    return iri;
}
function toLiteral(index, value, typeCache) {
    const { value: datatype } = value.get(ns.datatype);
    const literal = Object.freeze({ type: "literal", datatype });
    typeCache.get(ns.literal).set(index, literal);
    return literal;
}
function toProduct(index, database, typeCache, componentSources, optionSources, permutation) {
    const components = [];
    for (const component of componentSources.get(index) || []) {
        const { value: key } = component.get(ns.key);
        const value = toValue(component.get(ns.value), database, typeCache, componentSources, optionSources, permutation);
        components.push({ type: "component", key, value });
    }
    Object.freeze(components.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0)));
    const product = Object.freeze({ type: "product", components });
    typeCache.get(ns.product).set(index, product);
    return product;
}
function toCoproduct(index, database, typeCache, componentSources, optionSources, permutation) {
    const options = [];
    for (const option of optionSources.get(index) || []) {
        const { value: key } = option.get(ns.key);
        const value = toValue(option.get(ns.value), database, typeCache, componentSources, optionSources, permutation);
        options.push({ type: "option", key, value });
    }
    Object.freeze(options.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0)));
    const coproduct = Object.freeze({ type: "coproduct", options });
    typeCache.get(ns.coproduct).set(index, coproduct);
    return coproduct;
}
function rotateTree(trees, pivot) {
    const result = new Map();
    for (const tree of trees) {
        const value = tree.get(pivot);
        if (value === undefined || value.termType !== "Pointer") {
            throw new Error("Rotation failed because the value was not a pointer");
        }
        const trees = result.get(value.index);
        if (trees === undefined) {
            result.set(value.index, [tree]);
        }
        else {
            trees.push(tree);
        }
    }
    return result;
}
const ul = {
    label: new N3.NamedNode(ns.label),
    key: new N3.NamedNode(ns.key),
    value: new N3.NamedNode(ns.value),
    reference: new N3.NamedNode(ns.reference),
    unit: new N3.NamedNode(ns.unit),
    iri: new N3.NamedNode(ns.iri),
    literal: new N3.NamedNode(ns.literal),
    datatype: new N3.NamedNode(ns.datatype),
    product: new N3.NamedNode(ns.product),
    component: new N3.NamedNode(ns.component),
    coproduct: new N3.NamedNode(ns.coproduct),
    option: new N3.NamedNode(ns.option),
    source: new N3.NamedNode(ns.source),
};
const labelKeys = Object.freeze([ns.key, ns.value]);
const referenceKeys = Object.freeze([ns.value]);
const literalKeys = Object.freeze([ns.datatype]);
const productKeys = Object.freeze([ns.key, ns.source, ns.value]);
const coproductKeys = Object.freeze([ns.key, ns.source, ns.value]);
export function fromSchema(schema) {
    const id = getID();
    const database = new Map(schemaSchema.map(({ key }) => [key, []]));
    const cache = new Map();
    const labels = database.get(ns.label);
    for (const label of schema) {
        const value = fromType(id, database, cache, label.value);
        const key = ul[label.value.type].value;
        const variant = new APG.Variant(id(), key, value);
        labels.push(new APG.Record(id(), labelKeys, [new N3.NamedNode(label.key), variant]));
    }
    const instance = schemaSchema.map(({ key }) => {
        const values = database.get(key);
        Object.freeze(values);
        return values;
    });
    Object.freeze(instance);
    return instance;
}
function fromType(id, database, cache, type) {
    const pointer = cache.get(type);
    if (pointer !== undefined) {
        return new APG.Pointer(pointer);
    }
    else if (type.type === "reference") {
        const reference = new APG.Record(id(), referenceKeys, [
            new APG.Pointer(type.value),
        ]);
        const index = database.get(ns.reference).push(reference) - 1;
        cache.set(type, index);
        return new APG.Pointer(index);
    }
    else if (type.type === "unit") {
        const index = database.get(ns.unit).push(id()) - 1;
        cache.set(type, index);
        return new APG.Pointer(index);
    }
    else if (type.type === "iri") {
        const index = database.get(ns.iri).push(id()) - 1;
        cache.set(type, index);
        return new APG.Pointer(index);
    }
    else if (type.type === "literal") {
        const literal = new APG.Record(id(), literalKeys, [
            new N3.NamedNode(type.datatype),
        ]);
        const index = database.get(ns.literal).push(literal) - 1;
        cache.set(type, index);
        return new APG.Pointer(index);
    }
    else if (type.type === "product") {
        const index = database.get(ns.product).push(id()) - 1;
        cache.set(type, index);
        const components = database.get(ns.component);
        for (const component of type.components) {
            const key = ul[component.value.type].value;
            const value = fromType(id, database, cache, component.value);
            components.push(new APG.Record(id(), productKeys, [
                new N3.NamedNode(component.key),
                new APG.Pointer(index),
                new APG.Variant(id(), key, value),
            ]));
        }
        return new APG.Pointer(index);
    }
    else if (type.type === "coproduct") {
        const index = database.get(ns.coproduct).push(id()) - 1;
        cache.set(type, index);
        const options = database.get(ns.option);
        for (const option of type.options) {
            const key = ul[option.value.type].value;
            const value = fromType(id, database, cache, option.value);
            options.push(new APG.Record(id(), coproductKeys, [
                new N3.NamedNode(option.key),
                new APG.Pointer(index),
                new APG.Variant(id(), key, value),
            ]));
        }
        return new APG.Pointer(index);
    }
    else {
        signalInvalidType(type);
    }
}
//# sourceMappingURL=parse.js.map