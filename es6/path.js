export function getType(schema, source, target) {
    if (!(source in schema)) {
        throw new Error(`Path source not found in schema: ${source}`);
    }
    return target.reduce((t, { type, key: value }) => {
        if (t.type === "product" && value in t.components) {
            return t.components[value];
        }
        else if (t.type === "coproduct" && value in t.options) {
            return t.options[value];
        }
        else {
            throw new Error("Invalid type index");
        }
    }, schema[source]);
}
export function* getValues(schema, instance, source, target) {
    if (!(source in schema)) {
        throw new Error(`Path source not found in schema: ${source}`);
    }
    for (const element of instance[source]) {
        const token = target.reduce((token, p) => {
            if (token === null) {
                return null;
            }
            const [type, value] = token;
            if (type.type === "product" &&
                p.key in type.components &&
                value.termType === "Record") {
                return [type.components[p.key], value.get(p.key)];
            }
            else if (type.type === "coproduct" &&
                p.key in type.options &&
                value.termType === "Variant" &&
                value.option === p.key) {
                return [type.options[p.key], value.value];
            }
            else {
                throw new Error("Invalid target path");
            }
        }, [schema[source], element]);
        if (token !== null) {
            const [{}, value] = token;
            yield value;
        }
    }
}
//# sourceMappingURL=path.js.map