const keyMap = new WeakMap();
export function* forEntries(object) {
    for (const [index, key] of getKeys(object).entries()) {
        yield [key, object[key], index];
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
export const zip = (...args) => ({
    [Symbol.iterator]() {
        const iterators = args.map((arg) => arg[Symbol.iterator]());
        let i = 0;
        return {
            next() {
                const results = iterators.map((iter) => iter.next());
                if (results.some(({ done }) => done)) {
                    return { done: true, value: undefined };
                }
                else {
                    const values = results.map(({ value }) => value);
                    return { done: false, value: [...values, i++] };
                }
            },
        };
    },
});
