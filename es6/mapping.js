import * as N3 from "n3.ts";
import zip from "ziterable";
import APG from "./apg.js";
import { validateExpressions } from "./morphism.js";
import { getType, getValues } from "./path.js";
import { getID, rootId, signalInvalidType } from "./utils.js";
export function validateMapping(M, S, T) {
    const maps = new Map(M.map((m) => [m.key, m]));
    for (const { key, value } of S) {
        const m = maps.get(key);
        if (m === undefined) {
            return false;
        }
        const source = getType(T, m.source, m.target);
        const target = fold(M, S, T, value);
        if (validateExpressions(S, m.value, source, target)) {
            continue;
        }
        else {
            return false;
        }
    }
    return true;
}
export function fold(M, S, T, type) {
    if (type.type === "reference") {
        const { source, target } = M.find(({ key }) => key === S[type.value].key);
        const value = getType(T, source, target);
        if (value === undefined) {
            throw new Error("Invalid reference index");
        }
        else {
            return value;
        }
    }
    else if (type.type === "unit") {
        return type;
    }
    else if (type.type === "iri") {
        return type;
    }
    else if (type.type === "literal") {
        return type;
    }
    else if (type.type === "product") {
        const components = [];
        for (const { key, value } of type.components) {
            components.push(Object.freeze({
                type: "component",
                key,
                value: fold(M, S, T, value),
            }));
        }
        Object.freeze(components);
        return Object.freeze({ type: "product", components });
    }
    else if (type.type === "coproduct") {
        const options = [];
        for (const { key, value } of type.options) {
            options.push(Object.freeze({ type: "option", key, value: fold(M, S, T, value) }));
        }
        Object.freeze(options);
        return Object.freeze({ type: "coproduct", options });
    }
    else {
        signalInvalidType(type);
    }
}
export const mapExpressions = (expressions, value, instance, schema, id) => expressions.reduce((value, expression) => map(expression, value, instance, schema, id), value);
export function map(expression, value, instance, schema, id) {
    if (expression.type === "identity") {
        return value;
    }
    else if (expression.type === "initial") {
        throw new Error("Not implemented");
    }
    else if (expression.type === "terminal") {
        if (value.termType === "BlankNode") {
            return value;
        }
        else {
            throw new Error("Invalid terminal expression");
        }
    }
    else if (expression.type === "identifier") {
        return expression.value;
    }
    else if (expression.type === "constant") {
        return expression.value;
    }
    else if (expression.type === "dereference") {
        if (value.termType === "Pointer") {
            const index = schema.findIndex(({ key }) => key === expression.key);
            if (index in instance && value.index in instance[index]) {
                return instance[index][value.index];
            }
            else {
                throw new Error("Invalid pointer dereference");
            }
        }
        else {
            throw new Error("Invalid pointer dereference");
        }
    }
    else if (expression.type === "projection") {
        if (value.termType === "Record") {
            const index = value.componentKeys.indexOf(expression.key);
            if (index in value) {
                return value[index];
            }
            else {
                throw new Error("Invalid projection");
            }
        }
        else {
            throw new Error("Invalid projection");
        }
    }
    else if (expression.type === "match") {
        if (value.termType === "Variant") {
            const c = expression.cases.find(({ key }) => key === value.key);
            if (c !== undefined) {
                return mapExpressions(c.value, value.value, instance, schema, id);
            }
            else {
                throw new Error("Invalid case analysis");
            }
        }
        else {
            throw new Error("Invalid match morphism");
        }
    }
    else if (expression.type === "tuple") {
        const keys = expression.slots.map(({ key }) => key);
        Object.freeze(keys);
        return new APG.Record(id(), keys, expression.slots.map((slot) => mapExpressions(slot.value, value, instance, schema, id)));
    }
    else if (expression.type === "injection") {
        return new APG.Variant(id(), expression.key, mapExpressions(expression.value, value, instance, schema, id));
    }
    else {
        signalInvalidType(expression);
    }
}
export function delta(M, S, T, TI) {
    const SI = S.map(() => []);
    const indices = S.map(() => new Map());
    const id = getID();
    for (const [i, { value: type, key }] of S.entries()) {
        const m = M.find((m) => m.key === key);
        for (const value of getValues(T, TI, m.source, m.target)) {
            if (indices[i].has(value)) {
                continue;
            }
            else {
                const imageValue = mapExpressions(m.value, value, TI, T, id);
                const index = SI[i].push(placeholder) - 1;
                indices[i].set(value, index);
                SI[i][index] = pullback(M, S, T, SI, TI, indices, id, type, imageValue);
            }
        }
    }
    for (const values of SI) {
        Object.freeze(values);
    }
    Object.freeze(SI);
    return SI;
}
const placeholder = new N3.NamedNode(rootId);
function pullback(M, S, T, SI, TI, indices, id, type, // in source
value // of image
) {
    const [{}, M2] = M;
    if (type.type === "reference") {
        // Here we actually know that value is an instance of M1[type.value]
        // So now what?
        // First we check to see if the value is in the index cache.
        // (We're ultimately going to return a Pointer for sure)
        const index = indices[type.value].get(value);
        if (index !== undefined) {
            return new APG.Pointer(index);
        }
        else {
            // Otherwise, we map value along the morphism M2[type.value].
            // This gives us a value that is an instance of the image of the referenced type
            // - ie an instance of fold(M1, T, S[type.value].value)
            const t = S[type.value].value;
            const m = M.find(({ key }) => key === S[type.value].key);
            const v = mapExpressions(m.value, value, TI, T, id);
            const index = SI[type.value].push(placeholder) - 1;
            indices[type.value].set(value, index);
            const p = pullback(M, S, T, SI, TI, indices, id, t, v);
            SI[type.value][index] = p;
            return new APG.Pointer(index);
        }
    }
    else if (type.type === "unit") {
        if (value.termType !== "BlankNode") {
            throw new Error("Invalid image value: expected blank node");
        }
        else {
            return value;
        }
    }
    else if (type.type === "iri") {
        if (value.termType !== "NamedNode") {
            throw new Error("Invalid image value: expected iri");
        }
        else {
            return value;
        }
    }
    else if (type.type === "literal") {
        if (value.termType !== "Literal") {
            throw new Error("Invalid image value: expected literal");
        }
        else {
            return value;
        }
    }
    else if (type.type === "product") {
        if (value.termType !== "Record") {
            throw new Error("Invalid image value: expected record");
        }
        else {
            return new APG.Record(value.node, value.componentKeys, pullbackComponents(M, S, T, SI, TI, indices, id, type, value));
        }
    }
    else if (type.type === "coproduct") {
        if (value.termType !== "Variant") {
            throw new Error("Invalid image value: expected variant");
        }
        else {
            const option = type.options.find(({ key }) => key === value.key);
            if (option === undefined) {
                throw new Error("Invalid image variant");
            }
            else {
                return new APG.Variant(value.node, value.key, pullback(M, S, T, SI, TI, indices, id, option.value, value.value));
            }
        }
    }
    else {
        signalInvalidType(type);
    }
}
function* pullbackComponents(M, S, T, SI, TI, indices, id, type, value) {
    for (const [t, field] of zip(type.components, value)) {
        yield pullback(M, S, T, SI, TI, indices, id, t.value, field);
    }
}
//# sourceMappingURL=mapping.js.map