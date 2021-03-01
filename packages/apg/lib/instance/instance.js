import { forEntries, getKeyIndex, getKeys, signalInvalidType, } from "../utils.js";
export const instance = (schema, instance) => {
    for (const [_, values] of forEntries(instance)) {
        Object.freeze(values);
    }
    return Object.freeze(instance);
};
export function fromJSON(value) {
    if (value.kind === "reference") {
        return Reference.fromJSON(value);
    }
    else if (value.kind === "uri") {
        return Uri.fromJSON(value);
    }
    else if (value.kind === "literal") {
        return Literal.fromJSON(value);
    }
    else if (value.kind === "product") {
        return Product.fromJSON(value);
    }
    else if (value.kind === "coproduct") {
        return Coproduct.fromJSON(value);
    }
    else {
        signalInvalidType(value);
    }
}
export class Reference {
    constructor(index) {
        this.index = index;
        Object.freeze(this);
    }
    static fromJSON({ index }) {
        return new Reference(index);
    }
    get kind() {
        return "reference";
    }
    toJSON() {
        return { kind: "reference", index: this.index };
    }
}
export const reference = (type, index) => new Reference(index);
export const isReference = (value) => value.kind === "reference";
export class Uri {
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static fromJSON({ value }) {
        return new Uri(value);
    }
    get kind() {
        return "uri";
    }
    toJSON() {
        return { kind: "uri", value: this.value };
    }
}
export const uri = (type, value) => new Uri(value);
export const isUri = (value) => value.kind === "uri";
export class Literal {
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static fromJSON({ value }) {
        return new Literal(value);
    }
    get kind() {
        return "literal";
    }
    toJSON() {
        return { kind: "literal", value: this.value };
    }
}
export const literal = (type, value) => new Literal(value);
export const isLiteral = (value) => value.kind === "literal";
export class Product extends Array {
    static fromJSON({ components, }) {
        return new Product(components.map(fromJSON));
    }
    get kind() {
        return "product";
    }
    constructor(values) {
        super(...values);
        Object.freeze(this);
    }
    toJSON() {
        return { kind: "product", components: this.map((value) => value.toJSON()) };
    }
    get(type, key) {
        const index = getKeyIndex(type.components, key);
        if (index in this) {
            return this[index];
        }
        else {
            throw new Error(`Index out of range: ${index}`);
        }
    }
}
export const product = (type, components) => new Product(getKeys(type.components).map((key) => components[key]));
export const isProduct = (value) => value.kind === "product";
export const unit = (type) => new Product([]);
export const isUnit = (value) => value.kind === "product" && value.length === 0;
export class Coproduct {
    constructor(index, value) {
        this.index = index;
        this.value = value;
        Object.freeze(this);
    }
    static fromJSON({ index, value }) {
        return new Coproduct(index, fromJSON(value));
    }
    get kind() {
        return "coproduct";
    }
    toJSON() {
        return { kind: "coproduct", index: this.index, value: this.value.toJSON() };
    }
    key(type) {
        const keys = getKeys(type.options);
        if (this.index in keys) {
            return keys[this.index];
        }
        else {
            throw new Error(`Index out of range: ${this.index}`);
        }
    }
    is(type, key) {
        return getKeyIndex(type.options, key) === this.index;
    }
}
export const coproduct = (type, key, value) => new Coproduct(getKeyIndex(type.options, key), value);
export const isCoproduct = (value) => value.kind === "coproduct";
