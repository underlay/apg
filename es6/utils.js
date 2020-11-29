import { BlankNode } from "n3.ts";
import { v4 as uuid } from "uuid";
const keyMap = new WeakMap();
export function* forEntries(object) {
    for (const key of getKeys(object)) {
        yield [key, object[key]];
    }
}
export function getKeys(object) {
    if (keyMap.has(object)) {
        return keyMap.get(object);
    }
    else {
        const keys = Object.keys(object).sort();
        Object.freeze(keys);
        keyMap.set(object, keys);
        return keys;
    }
}
export function getKeyIndex(object, key) {
    if (keyMap.has(object)) {
        const index = keyMap.get(object).indexOf(key);
        if (index === -1) {
            throw new Error(`Key not found: ${key}`);
        }
        return index;
    }
    else {
        const keys = Object.keys(object).sort();
        Object.freeze(keys);
        keyMap.set(object, keys);
        const index = keys.indexOf(key);
        if (index === -1) {
            throw new Error(`Key not found: ${key}`);
        }
        return index;
    }
}
export function mapKeys(object, map) {
    const keys = getKeys(object);
    const result = Object.fromEntries(keys.map((key) => [key, map(object[key], key)]));
    keyMap.set(result, keys);
    Object.freeze(result);
    return result;
}
export function signalInvalidType(type) {
    console.error(type);
    throw new Error("Invalid type");
}
export const rootId = uuid();
export function getID() {
    let id = 0;
    return () => new BlankNode(`b${id++}`);
}
export function freezeType(type) {
    if (type.type === "product") {
        for (const [_, value] of forEntries(type.components)) {
            freezeType(value);
        }
        Object.freeze(type.components);
    }
    else if (type.type === "coproduct") {
        for (const [_, value] of forEntries(type.options)) {
            freezeType(value);
        }
        Object.freeze(type.options);
    }
    Object.freeze(type);
}
//# sourceMappingURL=utils.js.map