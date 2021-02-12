import { Schema, Instance, getKeys, signalInvalidType, getKeyIndex, forEntries, mapKeys, } from "@underlay/apg";
import { ul } from "@underlay/namespaces";
import schemaSchema, { value as valueType, label as labelType, component as componentType, option as optionType, } from "./schema.js";
export function toSchema(instance) {
    const labels = instance[ul.label];
    const sources = {
        components: rotateTree(instance[ul.component]),
        options: rotateTree(instance[ul.option]),
    };
    const typeCache = { product: new Map(), coproduct: new Map() };
    const permutation = new Map(labels.map((label, i) => {
        const { value: key } = label.get(ul.key);
        return [i, key];
    }));
    const schema = Object.fromEntries(labels.map((label) => {
        const { value: key } = label.get(ul.key);
        const target = label.get(ul.value);
        const type = toType(target, instance, typeCache, sources, permutation);
        return [key, type];
    }));
    Object.freeze(schema);
    return schema;
}
function toType(value, instance, typeCache, sources, permutation) {
    if (value.is(ul.reference)) {
        const { index } = value.value;
        return Schema.reference(permutation.get(index));
    }
    else if (value.is(ul.uri)) {
        return Schema.uri();
    }
    else if (value.is(ul.literal)) {
        const { value: datatype } = value.value;
        return Schema.literal(datatype);
    }
    else if (value.is(ul.product)) {
        const { index } = value.value;
        return toProduct(index, instance, typeCache, sources, permutation);
    }
    else if (value.is(ul.coproduct)) {
        const { index } = value.value;
        return toCoproduct(index, instance, typeCache, sources, permutation);
    }
    else {
        throw new Error(`Invalid value variant key ${value.key}`);
    }
}
function toProduct(index, instance, typeCache, sources, permutation) {
    if (typeCache.product.has(index)) {
        return typeCache.product.get(index);
    }
    const components = sources.components.get(index);
    const product = Schema.product(components === undefined
        ? {}
        : Object.fromEntries(components.map((component) => {
            const { value: key } = component.get(ul.key);
            const value = toType(component.get(ul.value), instance, typeCache, sources, permutation);
            return [key, value];
        })));
    typeCache.product.set(index, product);
    return product;
}
function toCoproduct(index, instance, typeCache, sources, permutation) {
    if (typeCache.coproduct.has(index)) {
        return typeCache.coproduct.get(index);
    }
    const options = Object.fromEntries(sources.options.get(index).map((option) => {
        const { value: key } = option.get(ul.key);
        const value = toType(option.get(ul.value), instance, typeCache, sources, permutation);
        return [key, value];
    }));
    const coproduct = Schema.coproduct(options);
    typeCache.coproduct.set(index, coproduct);
    return coproduct;
}
function rotateTree(trees) {
    const result = new Map();
    for (const tree of trees) {
        const { index } = tree.get(ul.source);
        const trees = result.get(index);
        if (trees === undefined) {
            result.set(index, [tree]);
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
export function fromSchema(schema) {
    const instance = mapKeys(schemaSchema, () => []);
    const cache = new Map();
    for (const key of getKeys(schema)) {
        const type = schema[key];
        const variant = Instance.coproduct(valueKeys, ul[type.kind], fromType(schema, instance, cache, type));
        instance[ul.label].push(Instance.product(labelKeys, [Instance.uri(key), variant]));
    }
    for (const key of getKeys(schemaSchema)) {
        Object.freeze(instance[key]);
    }
    Object.freeze(instance);
    return instance;
}
function fromType(schema, instance, cache, type) {
    if (type.kind === "reference") {
        return Instance.reference(getKeyIndex(schema, type.value));
    }
    else if (type.kind === "uri") {
        return Instance.unit();
    }
    else if (type.kind === "literal") {
        return Instance.uri(type.datatype);
    }
    else if (type.kind === "product") {
        const pointer = cache.get(type);
        if (pointer !== undefined) {
            return Instance.reference(pointer);
        }
        const index = instance[ul.product].push(Instance.unit()) - 1;
        cache.set(type, index);
        for (const [key, value] of forEntries(type.components)) {
            instance[ul.component].push(Instance.product(componentKeys, [
                Instance.uri(key),
                Instance.reference(index),
                Instance.coproduct(valueKeys, ul[value.kind], fromType(schema, instance, cache, value)),
            ]));
        }
        return Instance.reference(index);
    }
    else if (type.kind === "coproduct") {
        const pointer = cache.get(type);
        if (pointer !== undefined) {
            return Instance.reference(pointer);
        }
        const index = instance[ul.coproduct].push(Instance.unit()) - 1;
        cache.set(type, index);
        for (const [key, value] of forEntries(type.options)) {
            instance[ul.option].push(Instance.product(optionKeys, [
                Instance.uri(key),
                Instance.reference(index),
                Instance.coproduct(valueKeys, ul[value.kind], fromType(schema, instance, cache, value)),
            ]));
        }
        return Instance.reference(index);
    }
    else {
        signalInvalidType(type);
    }
}
