import * as N3 from "n3.ts";
import APG from "../../apg.js";
import schemaSchema, { value as valueType, label as labelType, component as componentType, option as optionType, } from "./index.js";
import * as ns from "../../namespace.js";
import { getKeys, getID, signalInvalidType, getKeyIndex, forEntries, freezeType, mapKeys, } from "../../utils.js";
export function toSchema(instance) {
    const labels = instance[ns.label];
    const components = instance[ns.component];
    const options = instance[ns.option];
    const componentSources = rotateTree(components, ns.source);
    const optionSources = rotateTree(options, ns.source);
    const typeCache = { product: new Map(), coproduct: new Map() };
    //  = new Map(
    // 	getKeys(schemaSchema).map((key) => [key, new Map()])
    // )
    const permutation = new Map(labels.map((label, i) => {
        const { value: key } = label.get(ns.key);
        return [i, key];
    }));
    const schema = Object.fromEntries(labels.map((label) => {
        const { value: key } = label.get(ns.key);
        const target = label.get(ns.value);
        const type = toType(target, instance, typeCache, componentSources, optionSources, permutation);
        freezeType(type);
        return [key, type];
    }));
    Object.freeze(schema);
    return schema;
}
function toType(value, instance, typeCache, componentSources, optionSources, permutation) {
    const key = value.option;
    if (key === ns.reference) {
        const { index } = value.value;
        return { type: "reference", value: permutation.get(index) };
    }
    else if (key === ns.unit) {
        return { type: "unit" };
    }
    else if (key === ns.uri) {
        return { type: "uri" };
    }
    else if (key === ns.literal) {
        const { value: datatype } = value.value;
        return { type: "literal", datatype };
    }
    else if (key === ns.product) {
        const { index } = value.value;
        return toProduct(index, instance, typeCache, componentSources, optionSources, permutation);
    }
    else if (key === ns.coproduct) {
        const { index } = value.value;
        return toCoproduct(index, instance, typeCache, componentSources, optionSources, permutation);
    }
    else {
        throw new Error(`Invalid value variant key ${key}`);
    }
}
function toProduct(index, instance, typeCache, componentSources, optionSources, permutation) {
    if (typeCache.product.has(index)) {
        return typeCache.product.get(index);
    }
    const components = Object.fromEntries(componentSources.get(index).map((component) => {
        const { value: key } = component.get(ns.key);
        const value = toType(component.get(ns.value), instance, typeCache, componentSources, optionSources, permutation);
        return [key, value];
    }));
    const product = { type: "product", components };
    typeCache.product.set(index, product);
    return product;
}
function toCoproduct(index, instance, typeCache, componentSources, optionSources, permutation) {
    if (typeCache.coproduct.has(index)) {
        return typeCache.coproduct.get(index);
    }
    const options = Object.fromEntries(optionSources.get(index).map((option) => {
        const { value: key } = option.get(ns.key);
        const value = toType(option.get(ns.value), instance, typeCache, componentSources, optionSources, permutation);
        return [key, value];
    }));
    const coproduct = { type: "coproduct", options };
    typeCache.coproduct.set(index, coproduct);
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
const labelKeys = getKeys(labelType.components);
const componentKeys = getKeys(componentType.components);
const optionKeys = getKeys(optionType.components);
const valueKeys = getKeys(valueType.options);
const getValueIndex = (value) => {
    const index = valueKeys.indexOf(ns[value]);
    if (index === -1) {
        throw new Error("Invalid value option index");
    }
    else {
        return index;
    }
};
export function fromSchema(schema) {
    const id = getID();
    const instance = mapKeys(schemaSchema, () => []);
    const cache = new Map();
    for (const key of getKeys(schema)) {
        const type = schema[key];
        const variant = new APG.Variant(valueKeys, getValueIndex(type.type), fromType(schema, instance, cache, id, type));
        instance[ns.label].push(new APG.Record(labelKeys, [new N3.NamedNode(key), variant]));
    }
    for (const key of getKeys(schemaSchema)) {
        Object.freeze(instance[key]);
    }
    Object.freeze(instance);
    return instance;
}
function fromType(schema, instance, cache, id, type) {
    if (type.type === "reference") {
        return new APG.Pointer(getKeyIndex(schema, type.value));
    }
    else if (type.type === "unit") {
        return id();
    }
    else if (type.type === "uri") {
        return id();
    }
    else if (type.type === "literal") {
        return new N3.NamedNode(type.datatype);
    }
    else if (type.type === "product") {
        const pointer = cache.get(type);
        if (pointer !== undefined) {
            return new APG.Pointer(pointer);
        }
        const index = instance[ns.product].push(id()) - 1;
        cache.set(type, index);
        for (const [key, value] of forEntries(type.components)) {
            instance[ns.component].push(new APG.Record(componentKeys, [
                new N3.NamedNode(key),
                new APG.Pointer(index),
                new APG.Variant(valueKeys, getValueIndex(value.type), fromType(schema, instance, cache, id, value)),
            ]));
        }
        return new APG.Pointer(index);
    }
    else if (type.type === "coproduct") {
        const pointer = cache.get(type);
        if (pointer !== undefined) {
            return new APG.Pointer(pointer);
        }
        const index = instance[ns.coproduct].push(id()) - 1;
        cache.set(type, index);
        for (const [key, value] of forEntries(type.options)) {
            instance[ns.option].push(new APG.Record(optionKeys, [
                new N3.NamedNode(key),
                new APG.Pointer(index),
                new APG.Variant(valueKeys, getValueIndex(value.type), fromType(schema, instance, cache, id, value)),
            ]));
        }
        return new APG.Pointer(index);
    }
    else {
        signalInvalidType(type);
    }
}
//# sourceMappingURL=parse.js.map