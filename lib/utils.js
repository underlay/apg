import { NamedNode, BlankNode, Literal, rdf, xsd } from "n3.ts";
const xsdString = new NamedNode(xsd.string);
const rdfType = rdf.type;
export function signalInvalidType(type) {
    console.error(type);
    throw new Error("Invalid type");
}
export const sortKeys = ([{}, { key: a }], [{}, { key: b }]) => (a < b ? -1 : b < a ? 1 : 0);
export function rotateTree(trees, pivot) {
    const result = new Map();
    for (const tree of trees) {
        const { index } = tree.get(pivot);
        const trees = result.get(index);
        if (trees === undefined) {
            result.set(index, [tree]);
        }
        else {
            trees.push(tree);
        }
    }
    return result;
}
export const getBlankNodeId = (type, typeCache) => type.type === "reference" ? `_:l${type.value}` : typeCache.get(type);
export function equal(a, b) {
    if (a === b) {
        return true;
    }
    else if (a.type !== b.type) {
        return false;
    }
    else if (a.type === "reference" && b.type === "reference") {
        return a.value === b.value;
    }
    else if (a.type === "unit" && b.type === "unit") {
        return true;
    }
    else if (a.type === "iri" && b.type === "iri") {
        return true;
    }
    else if (a.type === "literal" && b.type === "literal") {
        return a.datatype === b.datatype;
    }
    else if (a.type === "product" && b.type === "product") {
        if (a.components.length !== b.components.length) {
            return false;
        }
        for (const [A, B] of zip(a.components, b.components)) {
            if (A.key !== B.key) {
                return false;
            }
            else if (equal(A.value, B.value)) {
                continue;
            }
            else {
                return false;
            }
        }
        return true;
    }
    else if (a.type === "coproduct" && b.type === "coproduct") {
        if (a.options.length !== b.options.length) {
            return false;
        }
        for (const [A, B] of zip(a.options, b.options)) {
            if (A.key !== B.key) {
                return false;
            }
            else if (equal(A.value, B.value)) {
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
export const zip3 = (a, b, c) => ({
    [Symbol.iterator]() {
        const iterA = a[Symbol.iterator]();
        const iterB = b[Symbol.iterator]();
        const iterC = c[Symbol.iterator]();
        let i = 0;
        return {
            next() {
                const resultA = iterA.next();
                const resultB = iterB.next();
                const resultC = iterC.next();
                if (resultA.done || resultB.done || resultC.done) {
                    return { done: true, value: undefined };
                }
                else {
                    return {
                        done: false,
                        value: [resultA.value, resultB.value, resultC.value, i++],
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
export function findCommonPrefixIndex(a, b) {
    for (const [A, B, i] of zip(a, b)) {
        if (A !== B) {
            return i;
        }
    }
    return Math.min(a.length, b.length);
}
//# sourceMappingURL=utils.js.map