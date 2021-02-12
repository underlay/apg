import { forEntries } from "../utils.js";
export const instance = (schema, instance) => {
    for (const [{}, values] of forEntries(instance)) {
        Object.freeze(values);
    }
    return Object.freeze(instance);
};
export class Reference {
    constructor(index) {
        this.index = index;
        Object.freeze(this);
    }
    get kind() {
        return "reference";
    }
}
export const reference = (index) => new Reference(index);
export const isReference = (value) => value.kind === "reference";
export class Uri {
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    get kind() {
        return "uri";
    }
}
export const uri = (value) => new Uri(value);
export const isUri = (value) => value.kind === "uri";
export class Literal {
    constructor(value, datatype) {
        this.value = value;
        this.datatype = datatype;
        Object.freeze(this);
    }
    get kind() {
        return "literal";
    }
}
export const literal = (value, datatype) => new Literal(value, datatype);
export const isLiteral = (value) => value.kind === "literal";
export class Product extends Array {
    constructor(components, values) {
        super(...values);
        this.components = components;
        Object.freeze(this);
    }
    get kind() {
        return "product";
    }
    get(key) {
        const index = this.components.indexOf(key);
        if (index in this) {
            return this[index];
        }
        else {
            throw new Error(`Index out of range: ${index}`);
        }
    }
    map(f) {
        const result = new Array(this.length);
        for (const [i, value] of this.entries()) {
            result[i] = f(value, i, this);
        }
        return result;
    }
}
export const product = (components, values) => new Product(components, values);
export const isProduct = (value) => value.kind === "product";
const unitKeys = [];
const unitValues = [];
export const unit = () => new Product(unitKeys, unitValues);
export class Coproduct {
    constructor(options, key, value) {
        this.options = options;
        this.key = key;
        this.value = value;
        this.index = options.indexOf(key);
        if (this.index in options) {
            Object.freeze(this);
        }
        else {
            throw new Error("Coproduct value index out of range");
        }
    }
    get kind() {
        return "coproduct";
    }
    is(key) {
        return key === this.key;
    }
}
export const coproduct = (options, key, value) => new Coproduct(options, key, value);
export const isCoproduct = (value) => value.kind === "coproduct";
