export function getType(schema, source, target) {
    const label = schema.find(({ key }) => key === source);
    if (label === undefined) {
        throw new Error(`Label not found in schema: ${source}`);
    }
    return target.reduce((t, { type, key: value }) => {
        if (t.type === "product") {
            const component = t.components.find(({ key }) => key === value);
            if (component !== undefined) {
                return component.value;
            }
        }
        else if (t.type === "coproduct") {
            const option = t.options.find(({ key }) => key === value);
            if (option !== undefined) {
                return option.value;
            }
        }
        throw new Error("Invalid type index");
    }, label.value);
}
export function* getValues(schema, instance, source, target) {
    const label = schema.findIndex(({ key }) => key === source);
    if (label === -1) {
        throw new Error(`Label not found in schema: ${source}`);
    }
    for (const element of instance[label]) {
        const token = target.reduce((token, p) => {
            if (token === null) {
                return null;
            }
            const [type, value] = token;
            if (type.type === "product" && value.termType === "Record") {
                const component = type.components.find(({ key }) => p.key);
                if (component === undefined) {
                    throw new Error(`Component not found in product type: ${p.key}`);
                }
                return [component.value, value.get(p.key)];
            }
            else if (type.type === "coproduct" && value.termType === "Variant") {
                if (value.key !== p.key) {
                    return null;
                }
                const option = type.options.find(({ key }) => key === p.key);
                if (option === undefined) {
                    throw new Error(`Option not found in coproduct type: ${p.key}`);
                }
                return [option.value, value.value];
            }
            else {
                throw new Error("Invalid target path");
            }
        }, [schema[label].value, element]);
        if (token !== null) {
            const [{}, value] = token;
            yield value;
        }
    }
}
//# sourceMappingURL=path.js.map