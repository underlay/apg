import { NamedNode, BlankNode, Literal, rdf, xsd } from "n3.ts";
const xsdString = new NamedNode(xsd.string);
const rdfType = rdf.type;
export function pivotTree(trees, key) {
    const pivot = new Map();
    for (const tree of trees) {
        const value = tree.get(key);
        if (value === undefined) {
            throw new Error("Pivot failure");
        }
        else {
            const trees = pivot.get(value);
            if (trees === undefined) {
                pivot.set(value, new Set([tree]));
            }
            else {
                trees.add(tree);
            }
        }
    }
    return pivot;
}
export const getBlankNodeId = (a) => typeof a === "string" ? `_:${a}` : `_:${a.value}`;
export const equal = (a, b) => (typeof a === "string" && typeof b === "string" && a === b) ||
    (typeof a !== "string" && typeof b !== "string" && a.value === b.value);
export const zip = (a, b) => ({
    [Symbol.iterator]() {
        const iterA = a[Symbol.iterator]();
        const iterB = b[Symbol.iterator]();
        let i = 0;
        return {
            next() {
                const resultA = iterA.next();
                const resultB = iterB.next();
                if (resultA.done || resultB.done) {
                    return { done: true, value: undefined };
                }
                else {
                    return {
                        done: false,
                        value: [resultA.value, resultB.value, i++],
                    };
                }
            },
        };
    },
});
export function parseObjectValue(object) {
    if (typeof object === "string") {
        if (object.startsWith("_:")) {
            return new BlankNode(object.slice(2));
        }
        else {
            return new NamedNode(object);
        }
    }
    else {
        const datatype = object.type === undefined ? xsdString : new NamedNode(object.type);
        return new Literal(object.value, object.language || datatype);
    }
}
export const anyType = {
    type: "TripleConstraint",
    predicate: rdf.type,
    min: 0,
    max: -1,
};
export function isAnyType(tripleExpr) {
    return (typeof tripleExpr !== "string" &&
        tripleExpr.type === "TripleConstraint" &&
        tripleExpr.predicate === rdf.type &&
        tripleExpr.min === 0 &&
        tripleExpr.max === -1 &&
        tripleExpr.valueExpr === undefined);
}
export function isAnyTypeResult(solutions) {
    return (solutions.type === "TripleConstraintSolutions" &&
        solutions.predicate === rdf.type &&
        solutions.solutions.every(isAnyTypeTripleResult));
}
function isAnyTypeTripleResult(triple) {
    return (triple.predicate === rdf.type &&
        triple.referenced === undefined &&
        typeof triple.object === "string");
}
export const isNodeConstraint = (shapeExpr) => typeof shapeExpr !== "string" &&
    shapeExpr.type === "NodeConstraint" &&
    shapeExpr.hasOwnProperty("nodeKind");
export const blankNodeConstraint = {
    type: "NodeConstraint",
    nodeKind: "bnode",
};
export const isBlankNodeConstraint = (shapeExpr) => isNodeConstraint(shapeExpr) && shapeExpr.nodeKind === "bnode";
export function isBlankNodeConstraintResult(result) {
    return (result.type === "NodeConstraintTest" &&
        isBlankNodeConstraint(result.shapeExpr));
}
//# sourceMappingURL=utils.js.map