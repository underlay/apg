import t from "io-ts";
import { equal, zip } from "./utils.js";
var APG;
(function (APG) {
    class Tree {
        constructor(node, children) {
            this.node = node;
            this.children = new Map(children);
        }
        [Symbol.iterator]() {
            return this.children.entries();
        }
        keys() {
            return this.children.keys();
        }
        values() {
            return this.children.values();
        }
        entries() {
            return this.children.entries();
        }
        get termType() {
            return "Tree";
        }
        get size() {
            return this.children.size;
        }
        get(component) {
            return this.children.get(component);
        }
    }
    APG.Tree = Tree;
    APG.toId = (id) => `_:${id}`;
    APG.toValue = (id) => typeof id === "string"
        ? APG.toId(id)
        : { type: "reference", value: APG.toId(id.value) };
    function toJSON(schema) {
        const graph = [];
        for (const [id, label] of schema.labels) {
            graph.push({
                id: APG.toId(id),
                type: "label",
                key: label.key,
                value: APG.toValue(label.value),
            });
        }
        for (const [id, type] of schema.types) {
            if (type.type === "unit") {
                graph.push({ id: APG.toId(id), type: "unit" });
            }
            else if (type.type === "iri") {
                graph.push({ id: APG.toId(id), type: "iri" });
            }
            else if (type.type === "literal") {
                graph.push({ id: APG.toId(id), ...type });
            }
            else if (type.type === "product") {
                const components = [];
                for (const [id, { key, value }] of type.components) {
                    components.push({
                        id: APG.toId(id),
                        type: "component",
                        key,
                        value: APG.toValue(value),
                    });
                }
                graph.push({ id: APG.toId(id), type: "product", components });
            }
            else if (type.type === "coproduct") {
                const options = [];
                for (const [id, { value }] of type.options) {
                    options.push({
                        id: APG.toId(id),
                        type: "option",
                        value: APG.toValue(value),
                    });
                }
                graph.push({ id: APG.toId(id), type: "coproduct", options });
            }
        }
        return graph;
    }
    APG.toJSON = toJSON;
    APG.iriHasPattern = (expression) => expression.hasOwnProperty("pattern");
    APG.literalHasPattern = (expression) => expression.hasOwnProperty("pattern");
    function validateMorphism(morphism, source, target, schema) {
        if (morphism.type === "identity") {
            return equal(source, target);
        }
        else if (morphism.type === "composition") {
            const [A, B, C] = morphism.objects;
            const [AB, BC] = morphism.morphisms;
            return (A === source &&
                C === target &&
                validateMorphism(AB, A, B, schema) &&
                validateMorphism(BC, B, B, schema));
        }
        else if (morphism.type === "projection") {
            if (typeof source === "string") {
                const product = schema.types.get(source);
                if (product !== undefined && product.type === "product") {
                    const component = product.components.get(morphism.component);
                    return component !== undefined && equal(component.value, target);
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        else if (morphism.type === "injection") {
            if (typeof target === "string") {
                const coproduct = schema.types.get(target);
                if (coproduct !== undefined && coproduct.type === "coproduct") {
                    const option = coproduct.options.get(morphism.option);
                    return option !== undefined && equal(option.value, source);
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        else if (morphism.type === "tuple") {
            if (typeof target === "string") {
                const product = schema.types.get(target);
                if (product !== undefined &&
                    product.type === "product" &&
                    morphism.morphisms.size === product.components.size) {
                    const iter = zip(morphism.morphisms, product.components);
                    for (const [[mId, m], [cId, c]] of iter) {
                        if (mId === cId && validateMorphism(m, source, c.value, schema)) {
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
            else {
                return false;
            }
        }
        else if (morphism.type === "case") {
            if (typeof source === "string") {
                const coproduct = schema.types.get(source);
                if (coproduct !== undefined &&
                    coproduct.type === "coproduct" &&
                    morphism.morphisms.size === coproduct.options.size) {
                    const iter = zip(morphism.morphisms, coproduct.options);
                    for (const [[mId, m], [oId, o]] of iter) {
                        if (mId === oId && validateMorphism(m, o.value, target, schema)) {
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
            else {
                return false;
            }
        }
        else {
            throw new Error("Invalid morphism type");
        }
    }
    APG.validateMorphism = validateMorphism;
    const idPattern = /^_:[a-z][a-zA-Z0-9-]*$/;
    const blankNodeId = t.brand(t.string, (string) => idPattern.test(string), "ID");
    const reference = t.type({ type: t.literal("reference"), value: blankNodeId });
    const value = t.union([blankNodeId, reference]);
    const label = t.type({
        id: blankNodeId,
        type: t.literal("label"),
        key: t.string,
        value,
    });
    const unit = t.type({ id: blankNodeId, type: t.literal("unit") });
    const iri = t.type({ id: blankNodeId, type: t.literal("iri") });
    const literal = t.union([
        t.type({ id: blankNodeId, type: t.literal("literal"), datatype: t.string }),
        t.type({
            id: blankNodeId,
            type: t.literal("literal"),
            datatype: t.string,
            pattern: t.string,
            flags: t.string,
        }),
    ]);
    const component = t.type({
        id: blankNodeId,
        type: t.literal("component"),
        key: t.string,
        value,
    });
    const product = t.type({
        id: blankNodeId,
        type: t.literal("product"),
        components: t.array(component),
    });
    const option = t.type({
        id: blankNodeId,
        type: t.literal("option"),
        value,
    });
    const coproduct = t.type({
        id: blankNodeId,
        type: t.literal("coproduct"),
        options: t.array(option),
    });
    const schema = t.array(t.union([label, unit, iri, literal, product, coproduct]));
    const isID = (reference) => typeof reference === "string";
    const trimReference = (reference) => isID(reference)
        ? reference.slice(2)
        : Object.freeze({ type: "reference", value: reference.value.slice(2) });
    APG.codec = new t.Type("Schema", schema.is, (input, context) => {
        const result = schema.validate(input, context);
        if (result._tag === "Left") {
            return result;
        }
        const labels = new Set();
        const types = new Set();
        for (const value of result.right) {
            if (value.type === "label") {
                labels.add(value.id);
            }
            else {
                types.add(value.id);
            }
        }
        for (const value of result.right) {
            if (value.type === "label") {
                if (isID(value.value)) {
                    if (types.has(value.value)) {
                        continue;
                    }
                    else {
                        const message = `Invalid label value: ${value.value}`;
                        return {
                            _tag: "Left",
                            left: [{ value: input, context, message }],
                        };
                    }
                }
                else {
                    if (labels.has(value.value.value)) {
                        continue;
                    }
                    else {
                        const message = `Invalid label alias: ${value.value}`;
                        return {
                            _tag: "Left",
                            left: [{ value: input, context, message }],
                        };
                    }
                }
            }
            else if (value.type === "product") {
                for (const component of value.components) {
                    if (isID(component.value)) {
                        if (types.has(component.value)) {
                            continue;
                        }
                        else {
                            const message = `Invalid type: ${component.value}`;
                            const error = { value: input, context, message };
                            return { _tag: "Left", left: [error] };
                        }
                    }
                    else {
                        if (labels.has(component.value.value)) {
                            continue;
                        }
                        else {
                            const message = `Invalid label reference: ${component.value.value}`;
                            const error = { value: input, context, message };
                            return { _tag: "Left", left: [error] };
                        }
                    }
                }
            }
            else if (value.type === "coproduct") {
                for (const option of value.options) {
                    if (isID(option.value)) {
                        if (types.has(option.value)) {
                            continue;
                        }
                        else {
                            const message = `Invalid type: ${option.value}`;
                            const error = { value: input, context, message };
                            return { _tag: "Left", left: [error] };
                        }
                    }
                    else {
                        if (labels.has(option.value.value)) {
                            continue;
                        }
                        else {
                            const message = `Invalid label reference: ${option.value.value}`;
                            const error = { value: input, context, message };
                            return { _tag: "Left", left: [error] };
                        }
                    }
                }
            }
        }
        return result;
    }, (values) => {
        const labels = new Map();
        const types = new Map();
        for (const { id, ...value } of values) {
            const name = id.slice(2);
            if (value.type === "label") {
                labels.set(name, Object.freeze({
                    type: "label",
                    key: value.key,
                    value: trimReference(value.value),
                }));
            }
            else if (value.type === "product") {
                const components = new Map(value.components.map((component) => {
                    const id = component.id.slice(2);
                    const value = trimReference(component.value);
                    return [
                        id,
                        Object.freeze({ type: "component", key: component.key, value }),
                    ];
                }));
                types.set(name, { type: "product", components });
            }
            else if (value.type === "coproduct") {
                const options = new Map(value.options.map((option) => {
                    const id = option.id.slice(2);
                    const value = trimReference(option.value);
                    return [id, Object.freeze({ type: "option", value })];
                }));
                types.set(name, Object.freeze({ type: "coproduct", options }));
            }
            else {
                types.set(name, Object.freeze({ ...value }));
            }
        }
        return Object.freeze({ labels, types });
    });
})(APG || (APG = {}));
export default APG;
//# sourceMappingURL=apg.js.map