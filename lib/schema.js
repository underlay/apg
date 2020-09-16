export const context = {
    id: "@id",
    type: "@type",
    "@vocab": "http://underlay.org/ns/",
    key: { "@type": "@id" },
    datatype: { "@type": "@id" },
    options: {
        "@reverse": "source",
    },
    components: {
        "@reverse": "source",
    },
};
export const isReference = (expression) => expression.hasOwnProperty("id");
export const iriHasPattern = (expression) => expression.hasOwnProperty("pattern");
export const literalHasPattern = (expression) => expression.hasOwnProperty("pattern");
export class Tree {
    constructor(node, children) {
        this.node = node;
        this.children = children instanceof Map ? children : new Map(children);
    }
    get termType() {
        return "Tree";
    }
    get value() {
        return this.node.value;
    }
    get size() {
        return this.children.size;
    }
    [Symbol.iterator]() {
        return this.children[Symbol.iterator]();
    }
    get(node) {
        return this.children.get(node);
    }
}
//# sourceMappingURL=schema.js.map