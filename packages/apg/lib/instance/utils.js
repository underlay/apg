import * as Schema from "../schema/schema.js";
import * as Instance from "./instance.js";
import { getKeys, zip } from "../utils.js";
export function validateInstance(schema, instance) {
    for (const key of getKeys(schema)) {
        if (key in instance) {
            for (const value of instance[key]) {
                if (validateValue(schema[key], value)) {
                    continue;
                }
                else {
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }
    return true;
}
export function validateValue(type, value) {
    if (Schema.isReference(type)) {
        return Instance.isReference(value);
    }
    else if (Schema.isUri(type)) {
        return Instance.isUri(value);
    }
    else if (Schema.isLiteral(type)) {
        return Instance.isLiteral(value);
    }
    else if (Schema.isProduct(type)) {
        if (Instance.isProduct(value)) {
            const keys = getKeys(type.components);
            if (keys.length !== value.length) {
                return false;
            }
            for (const [key, component] of zip(keys, value)) {
                if (validateValue(type.components[key], component)) {
                    continue;
                }
                else {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
    else if (Schema.isCoproduct(type)) {
        const keys = getKeys(type.options);
        if (Instance.isCoproduct(value) && value.index in keys) {
            const key = keys[value.index];
            return validateValue(type.options[key], value.value);
        }
        else {
            return false;
        }
    }
    else {
        console.error(type);
        throw new Error("Unexpected type");
    }
}
// type IndexValue<Schema extends Record<string, Schema.Type>> =
function* indexValue(type, value, path) {
    if (path.length === 0) {
        yield value;
    }
    else {
        const [key, ...rest] = path;
        if (type.kind === "product" && value.kind === "product") {
            if (key in type.components) {
                yield* indexValue(type.components[key], value.get(type, key), rest);
            }
            else {
                throw new Error(`Invalid product component: ${key}`);
            }
        }
        else if (type.kind === "coproduct" && value.kind === "coproduct") {
            if (key in type.options) {
                if (value.is(type, key)) {
                    yield* indexValue(type.options[key], value.value, rest);
                }
            }
            else {
                throw new Error(`Invalid coproduct option: ${key}`);
            }
        }
    }
}
export function* forValues(schema, instance, key, path) {
    if (key in schema && key in instance) {
        for (const value of instance[key]) {
            yield* indexValue(schema[key], value, path);
        }
    }
    else {
        console.error(key, schema, instance);
        throw new Error(`Invalid key ${key}`);
    }
}
