import { Schema, unify, isTypeAssignable } from "../schema/index.js";
import { getKeys, mapKeys, signalInvalidType } from "../utils.js";
export const applyExpressions = (S, expressions, source) => expressions.reduce((type, expression) => apply(S, expression, type), source);
export function apply(S, expression, source) {
    if (expression.type === "identifier") {
        return Schema.uri();
    }
    else if (expression.type === "constant") {
        return Schema.literal(expression.datatype);
    }
    else if (expression.type === "dereference") {
        if (source.type === "reference" &&
            source.value in S &&
            source.value === expression.key) {
            return S[source.value];
        }
        else {
            throw new Error("Invalid dereference morphism");
        }
    }
    else if (expression.type === "projection") {
        if (source.type === "product" && expression.key in source.components) {
            return source.components[expression.key];
        }
        else {
            throw new Error("Invalid projection morphism");
        }
    }
    else if (expression.type === "injection") {
        const { key } = expression;
        return Schema.coproduct({ [key]: source });
    }
    else if (expression.type === "tuple") {
        return Schema.product(mapKeys(expression.slots, (value) => applyExpressions(S, value, source)));
    }
    else if (expression.type === "match") {
        if (source.type === "coproduct") {
            const cases = Array.from(applyCases(S, source, expression));
            if (cases.length === 0) {
                throw new Error("Empty case analysis");
            }
            else {
                return cases.reduce(unify);
            }
        }
        else {
            throw new Error("Invalid match morphism");
        }
    }
    else {
        signalInvalidType(expression);
    }
}
function* applyCases(S, source, { cases }) {
    for (const key of getKeys(source.options)) {
        if (key in cases) {
            yield applyExpressions(S, cases[key], source.options[key]);
        }
        else {
            throw new Error("Invalid case analysis");
        }
    }
}
export function validateExpressions(S, expressions, source, target) {
    let type;
    try {
        type = applyExpressions(S, expressions, source);
    }
    catch (e) {
        return false;
    }
    return isTypeAssignable(type, target);
}