import * as N3 from "n3.ts";
import APG from "./apg.js";
import schemaSchema from "./bootstrap.js";
import * as ns from "./namespace.js";
import { signalInvalidType } from "./utils.js";
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
    // const { index } = record.get(ns.value) as APG.Pointer
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
const schemaIndices = new Map(schemaSchema.map(({ key }, i) => [key, i]));
const labelIndex = schemaIndices.get(ns.label);
const unitIndex = schemaIndices.get(ns.unit);
const referenceIndex = schemaIndices.get(ns.reference);
const iriIndex = schemaIndices.get(ns.iri);
const literalIndex = schemaIndices.get(ns.literal);
const productIndex = schemaIndices.get(ns.product);
const coproductIndex = schemaIndices.get(ns.coproduct);
const valueKeys = Object.freeze([
    ns.coproduct,
    ns.iri,
    ns.literal,
    ns.product,
    ns.reference,
    ns.unit,
]);
const labelKeys = Object.freeze([ns.key, ns.value]);
const referenceKeys = Object.freeze([ns.value]);
const literalKeys = Object.freeze([ns.datatype]);
const productKeys = Object.freeze([ns.key, ns.source, ns.value]);
const coproductKeys = Object.freeze([ns.key, ns.source, ns.value]);
export function fromSchema(schema) {
    let id = 0;
    const database = new Map(schemaSchema.map(({ key }) => [key, []]));
    const cache = new Map();
    const labels = database.get(ns.label);
    for (const label of schema) {
        const [value, delta] = fromType(database, cache, label.value, id);
        id += delta;
        const key = valueKeys.indexOf(ul[label.value.type].value);
        const variant = new APG.Variant(new N3.BlankNode(`b${id++}`), valueKeys, key, value);
        labels.push(new APG.Record(new N3.BlankNode(`b${id++}`), labelKeys, [
            new N3.NamedNode(label.key),
            variant,
        ]));
    }
    const instance = schemaSchema.map(({ key }) => {
        const values = database.get(key);
        Object.freeze(values);
        return values;
    });
    Object.freeze(instance);
    return instance;
}
function fromType(database, cache, type, id) {
    const pointer = cache.get(type);
    if (pointer !== undefined) {
        const [index, label] = pointer;
        return [new APG.Pointer(index, label), id];
    }
    else if (type.type === "reference") {
        const reference = new APG.Record(new N3.BlankNode(`b${id++}`), referenceKeys, [new APG.Pointer(type.value, labelIndex)]);
        const index = database.get(ns.reference).push(reference) - 1;
        cache.set(type, [index, referenceIndex]);
        return [new APG.Pointer(index, referenceIndex), id];
    }
    else if (type.type === "unit") {
        const unit = new N3.BlankNode(`b${id++}`);
        const index = database.get(ns.unit).push(unit) - 1;
        cache.set(type, [index, unitIndex]);
        return [new APG.Pointer(index, unitIndex), id];
    }
    else if (type.type === "iri") {
        const iri = new N3.BlankNode(`b${id++}`);
        const index = database.get(ns.iri).push(iri) - 1;
        cache.set(type, [index, iriIndex]);
        return [new APG.Pointer(index, iriIndex), id];
    }
    else if (type.type === "literal") {
        const literal = new APG.Record(new N3.BlankNode(`b${id++}`), literalKeys, [
            new N3.NamedNode(type.datatype),
        ]);
        const index = database.get(ns.literal).push(literal) - 1;
        cache.set(type, [index, literalIndex]);
        return [new APG.Pointer(index, literalIndex), id];
    }
    else if (type.type === "product") {
        const product = new N3.BlankNode(`b${id++}`);
        const index = database.get(ns.product).push(product) - 1;
        cache.set(type, [index, productIndex]);
        const components = database.get(ns.component);
        for (const component of type.components) {
            const key = valueKeys.indexOf(ul[component.value.type].value);
            const [value, delta] = fromType(database, cache, component.value, id);
            id += delta;
            components.push(new APG.Record(new N3.BlankNode(`b${id++}`), productKeys, [
                new N3.NamedNode(component.key),
                new APG.Pointer(index, productIndex),
                new APG.Variant(new N3.BlankNode(`b${id++}`), valueKeys, key, value),
            ]));
        }
        return [new APG.Pointer(index, productIndex), id];
    }
    else if (type.type === "coproduct") {
        const coproduct = new N3.BlankNode(`b${id++}`);
        const index = database.get(ns.coproduct).push(coproduct) - 1;
        cache.set(type, [index, coproductIndex]);
        const options = database.get(ns.option);
        for (const option of type.options) {
            const key = valueKeys.indexOf(ul[option.value.type].value);
            const [value, delta] = fromType(database, cache, option.value, id);
            id += delta;
            options.push(new APG.Record(new N3.BlankNode(`b${id++}`), coproductKeys, [
                new N3.NamedNode(option.key),
                new APG.Pointer(index, coproductIndex),
                new APG.Variant(new N3.BlankNode(`b${id++}`), valueKeys, key, value),
            ]));
        }
        return [new APG.Pointer(index, coproductIndex), id];
    }
    else {
        signalInvalidType(type);
    }
}
//# sourceMappingURL=schema.js.map