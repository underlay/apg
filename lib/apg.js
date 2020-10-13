import t from "io-ts";
import { equal, sortKeys, zip, zip3 } from "./utils.js";
var APG;
(function (APG) {
    class Pointer {
        constructor(index) {
            this.index = index;
            Object.freeze(this);
        }
        get termType() {
            return "Pointer";
        }
    }
    APG.Pointer = Pointer;
    class Record extends Array {
        constructor(node, componentKeys, values) {
            super(...values);
            this.node = node;
            this.componentKeys = componentKeys;
            Object.freeze(this);
        }
        get termType() {
            return "Record";
        }
        get(key) {
            const index = this.componentKeys.indexOf(key);
            if (index === -1) {
                throw new Error("Key not found");
            }
            else {
                return this[index];
            }
        }
    }
    APG.Record = Record;
    class Variant {
        constructor(node, optionKeys, index, value) {
            this.node = node;
            this.optionKeys = optionKeys;
            this.index = index;
            this.value = value;
            Object.freeze(this);
        }
        get termType() {
            return "Variant";
        }
        get key() {
            return this.optionKeys[this.index];
        }
    }
    APG.Variant = Variant;
    function validateValue(value, type, schema) {
        if (type.type === "reference") {
            const label = schema[type.value];
            return validateValue(value, label.value, schema);
        }
        else if (type.type === "unit") {
            return value.termType === "BlankNode";
        }
        else if (type.type === "iri") {
            return value.termType === "NamedNode";
        }
        else if (type.type === "literal") {
            return (value.termType === "Literal" && value.datatype.value === type.datatype);
        }
        else if (type.type === "product") {
            if (value.termType === "Record" &&
                value.length === type.components.length) {
                const iter = zip3(value.componentKeys, value, type.components);
                for (const [k, v, { key, value }] of iter) {
                    if (k === key && validateValue(v, value, schema)) {
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
        else if (type.type === "coproduct") {
            if (value.termType === "Variant" && value.index < type.options.length) {
                const option = type.options[value.index];
                return validateValue(value.value, option.value, schema);
            }
            else {
                return false;
            }
        }
        else {
            throw new Error(`Invalid type ${type}`);
        }
    }
    APG.validateValue = validateValue;
    function validateMorphism(morphism, source, target, schema) {
        if (morphism.type === "constant") {
            return APG.validateValue(morphism.value, target, schema);
        }
        else if (morphism.type === "identity") {
            return equal(source, target);
        }
        else if (morphism.type === "composition") {
            const [AB, BC] = morphism.morphisms;
            return (validateMorphism(AB, source, morphism.object, schema) &&
                validateMorphism(BC, morphism.object, target, schema));
        }
        else if (morphism.type === "projection") {
            if (source.type !== "product") {
                return false;
            }
            else if (morphism.index >= source.components.length) {
                return false;
            }
            const { value } = source.components[morphism.index];
            return equal(value, target);
        }
        else if (morphism.type === "injection") {
            if (target.type !== "coproduct") {
                return false;
            }
            else if (morphism.index >= target.options.length) {
                return false;
            }
            const { value } = target.options[morphism.index];
            return equal(source, value);
        }
        else if (morphism.type === "tuple") {
            if (target.type !== "product") {
                return false;
            }
            else if (morphism.morphisms.length !== target.components.length) {
                return false;
            }
            for (const [m, c] of zip(morphism.morphisms, target.components)) {
                if (validateMorphism(m, source, c.value, schema)) {
                    continue;
                }
                else {
                    return false;
                }
            }
            return true;
        }
        else if (morphism.type === "case") {
            if (source.type !== "coproduct") {
                return false;
            }
            else if (morphism.morphisms.length !== source.options.length) {
                return false;
            }
            for (const [m, o] of zip(morphism.morphisms, source.options)) {
                if (validateMorphism(m, o.value, target, schema)) {
                    continue;
                }
                else {
                    return false;
                }
            }
            return true;
        }
        else {
            throw new Error("Invalid morphism");
        }
    }
    APG.validateMorphism = validateMorphism;
    APG.toId = (id) => `_:${id}`;
    function makeValue(type, graph, schema, typeIds) {
        if (type.type === "unit") {
            const id = APG.toId(`t-${graph.length}`);
            graph.push({ id, type: "unit" });
            typeIds.set(type, id);
            return id;
        }
        else if (type.type === "iri") {
            const id = APG.toId(`t-${graph.length}`);
            graph.push({ id, type: "iri" });
            typeIds.set(type, id);
            return id;
        }
        else if (type.type === "literal") {
            const id = APG.toId(`t-${graph.length}`);
            graph.push({ id, type: "literal", datatype: type.datatype });
            typeIds.set(type, id);
            return id;
        }
        else if (type.type === "product") {
            const componentValues = type.components.map(({ value }) => getValue(value, graph, schema, typeIds));
            const components = [];
            for (const [{ key }, value, i] of zip(type.components, componentValues)) {
                const id = APG.toId(`t-${graph.length}-${i}`);
                components.push({ id, type: "component", key, value });
            }
            const id = APG.toId(`t-${graph.length}`);
            graph.push({ id, type: "product", components });
            typeIds.set(type, id);
            return id;
        }
        else if (type.type === "coproduct") {
            const optionValues = type.options.map(({ value }) => getValue(value, graph, schema, typeIds));
            const options = [];
            for (const [{ key }, value, i] of zip(type.options, optionValues)) {
                const id = APG.toId(`t-${graph.length}-${i}`);
                options.push({ id, type: "option", key, value });
            }
            const id = APG.toId(`t-${graph.length}`);
            graph.push({ id, type: "coproduct", options });
            typeIds.set(type, id);
            return id;
        }
        else {
            throw new Error("Invalid value");
        }
    }
    function getValue(type, graph, schema, typeIds) {
        if (type.type === "reference") {
            const value = APG.toId(`l-${type.value}`);
            return { reference: { type: "reference", value } };
        }
        const id = typeIds.has(type)
            ? typeIds.get(type)
            : makeValue(type, graph, schema, typeIds);
        if (type.type === "unit") {
            return { unit: id };
        }
        else if (type.type === "iri") {
            return { iri: id };
        }
        else if (type.type === "literal") {
            return { literal: id };
        }
        else if (type.type === "product") {
            return { product: id };
        }
        else if (type.type === "coproduct") {
            return { coproduct: id };
        }
        else {
            throw new Error("Invalid type");
        }
    }
    function toJSON(schema) {
        const typeIds = new Map();
        const graph = [];
        const values = schema.map(({ value }) => getValue(value, graph, schema, typeIds));
        for (const [{ key }, value, index] of zip(schema, values)) {
            const id = APG.toId(`l-${index}`);
            graph.push({ id, type: "label", key, value });
        }
        return graph;
    }
    APG.toJSON = toJSON;
    const idPattern = /^_:[a-z][a-zA-Z0-9-]*$/;
    const blankNodeId = t.brand(t.string, (string) => idPattern.test(string), "ID");
    const reference = t.type({ type: t.literal("reference"), value: blankNodeId });
    const referenceValue = t.type({ reference: reference });
    const value = t.union([
        t.type({ unit: blankNodeId }),
        t.type({ iri: blankNodeId }),
        t.type({ literal: blankNodeId }),
        t.type({ product: blankNodeId }),
        t.type({ coproduct: blankNodeId }),
        referenceValue,
    ]);
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
        key: t.string,
        value,
    });
    const coproduct = t.type({
        id: blankNodeId,
        type: t.literal("coproduct"),
        options: t.array(option),
    });
    const schema = t.array(t.union([label, unit, iri, literal, product, coproduct]));
    const isReference = (reference) => reference.hasOwnProperty("reference");
    const getID = (reference) => {
        const [type] = Object.keys(reference);
        const ref = reference;
        return ref[type];
    };
    APG.codec = new t.Type("Schema", schema.is, (input, context) => {
        const result = schema.validate(input, context);
        if (result._tag === "Left") {
            return result;
        }
        const labels = new Set();
        const types = new Map();
        for (const value of result.right) {
            if (value.type === "label") {
                labels.add(value.id);
            }
            else {
                types.set(value.id, value.type);
            }
        }
        for (const value of result.right) {
            if (value.type === "label") {
                if (isReference(value.value)) {
                    if (labels.has(value.value.reference.value)) {
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
                else {
                    const id = getID(value.value);
                    if (types.has(id)) {
                        continue;
                    }
                    else {
                        const message = `Invalid label value: ${id}`;
                        return {
                            _tag: "Left",
                            left: [{ value: input, context, message }],
                        };
                    }
                }
            }
            else if (value.type === "product") {
                for (const component of value.components) {
                    if (isReference(component.value)) {
                        if (labels.has(component.value.reference.value)) {
                            continue;
                        }
                        else {
                            const message = `Invalid label reference: ${component.value.reference.value}`;
                            const error = { value: input, context, message };
                            return { _tag: "Left", left: [error] };
                        }
                    }
                    else {
                        const id = getID(component.value);
                        if (types.has(id)) {
                            continue;
                        }
                        else {
                            const message = `Invalid type: ${id}`;
                            const error = { value: input, context, message };
                            return { _tag: "Left", left: [error] };
                        }
                    }
                }
            }
            else if (value.type === "coproduct") {
                for (const option of value.options) {
                    if (isReference(option.value)) {
                        if (labels.has(option.value.reference.value)) {
                            continue;
                        }
                        else {
                            const message = `Invalid label reference: ${option.value.reference.value}`;
                            const error = { value: input, context, message };
                            return { _tag: "Left", left: [error] };
                        }
                    }
                    else {
                        const id = getID(option.value);
                        if (types.has(id)) {
                            continue;
                        }
                        else {
                            const message = `Invalid type: ${id}`;
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
        for (const value of values) {
            if (value.type === "label") {
                labels.set(value.id, value);
            }
            else {
                types.set(value.id, value);
            }
        }
        const labelArray = Array.from(labels).sort(sortKeys);
        const labelIds = new Map(labelArray.map(([id], index) => [id, index]));
        const typeCache = new Map();
        const schema = labelArray.map(([{}, { key, value }]) => Object.freeze({
            type: "label",
            key,
            value: cacheValue(value, types, typeCache, labelIds),
        }));
        Object.freeze(schema);
        return schema;
    });
    function cacheValue(reference, types, typeCache, labelIds) {
        if (isReference(reference)) {
            const labelId = reference.reference.value;
            const index = labelIds.get(labelId);
            if (index === undefined) {
                throw new Error(`Cannot find label ${labelId}`);
            }
            return Object.freeze({ type: "reference", value: index });
        }
        else {
            const id = getID(reference);
            return cacheType(id, types, typeCache, labelIds);
        }
    }
    function cacheType(id, types, typeCache, labelIds) {
        const cached = typeCache.get(id);
        if (cached !== undefined) {
            return cached;
        }
        const type = types.get(id);
        if (type.type === "unit") {
            const unit = Object.freeze({ type: "unit" });
            typeCache.set(id, unit);
            return unit;
        }
        else if (type.type === "iri") {
            const iri = Object.freeze({ type: "iri" });
            typeCache.set(id, iri);
            return iri;
        }
        else if (type.type === "literal") {
            const literal = Object.freeze({
                type: "literal",
                datatype: type.datatype,
            });
            typeCache.set(id, literal);
            return literal;
        }
        else if (type.type === "product") {
            const entries = type.components.map((component) => [component.id, component]);
            entries.sort(sortKeys);
            const components = entries.map(([{}, { key, value }]) => Object.freeze({
                type: "component",
                key,
                value: cacheValue(value, types, typeCache, labelIds),
            }));
            Object.freeze(components.sort(({ key: a }, { key: b }) => a < b ? -1 : b < a ? 1 : 0));
            const product = Object.freeze({ type: "product", components });
            typeCache.set(id, product);
            return product;
        }
        else if (type.type === "coproduct") {
            const entries = type.options.map((option) => [option.id, option]);
            entries.sort(sortKeys);
            const options = entries.map(([{}, { key, value }]) => Object.freeze({
                type: "option",
                key,
                value: cacheValue(value, types, typeCache, labelIds),
            }));
            Object.freeze(options.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0)));
            const coproduct = Object.freeze({ type: "coproduct", options });
            typeCache.set(id, coproduct);
            return coproduct;
        }
        else {
            throw new Error("Invalid type");
        }
    }
})(APG || (APG = {}));
export default APG;
//# sourceMappingURL=apg.js.map