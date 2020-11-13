export function getType(schema, [label, nil, ...path]) {
    if (isNaN(label) || label < 0 || label >= schema.length) {
        throw new Error("Invalid label index");
    }
    else if (!isNaN(nil)) {
        throw new Error("Invalid path");
    }
    const { value } = schema[label];
    return path.reduce((type, index) => {
        if (type.type === "product" &&
            index >= 0 &&
            index < type.components.length) {
            return type.components[index].value;
        }
        else if (type.type === "coproduct" &&
            index < 0 &&
            index >= -type.options.length) {
            return type.options[-1 - index].value;
        }
        else if (type.type === "reference" && isNaN(index)) {
            return schema[type.value].value;
        }
        else {
            throw new Error("Invalid type index");
        }
    }, value);
}
export function* getValues(instance, [label, nil, ...path]) {
    if (isNaN(label) || label < 0 || label >= instance.length) {
        throw new Error("Invalid label index");
    }
    else if (!isNaN(nil)) {
        throw new Error("Invalid path");
    }
    for (const element of instance[label]) {
        const value = path.reduce((value, index) => {
            if (value === null) {
                return null;
            }
            else if (value.termType === "Record" &&
                index >= 0 &&
                index < value.length) {
                return value[index];
            }
            else if (value.termType === "Variant" &&
                index < 0 &&
                index >= -value.optionKeys.length) {
                if (value.index === index) {
                    return value.value;
                }
                else {
                    return null;
                }
            }
            else if (value.termType === "Pointer" && isNaN(index)) {
                return instance[value.label][value.index];
            }
            else {
                throw new Error("Invalid value index");
            }
        }, element);
        if (value !== null) {
            yield value;
        }
    }
}
//# sourceMappingURL=path.js.map