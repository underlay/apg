import { rdf } from "n3.ts";
import { isBlankNodeConstraintResult, isAnyTypeResult, anyType, isAnyType, isBlankNodeConstraint, blankNodeConstraint, } from "./utils.js";
function isProductExpression(tripleExpr) {
    if (typeof tripleExpr === "string") {
        return false;
    }
    else if (tripleExpr.type !== "EachOf") {
        return false;
    }
    else if (tripleExpr.expressions.length === 0) {
        return false;
    }
    const [first, ...rest] = tripleExpr.expressions;
    return isAnyType(first) && rest.every(isComponentExpression);
}
function isComponentExpression(tripleExpr) {
    return (typeof tripleExpr !== "string" && tripleExpr.type === "TripleConstraint");
}
export function isProductShape(shapeExpr) {
    if (typeof shapeExpr === "string") {
        return false;
    }
    else if (shapeExpr.type !== "ShapeAnd") {
        return false;
    }
    else if (shapeExpr.shapeExprs.length !== 2) {
        return false;
    }
    const [nodeConstraint, shape] = shapeExpr.shapeExprs;
    if (typeof shape === "string") {
        return false;
    }
    else if (shape.type !== "Shape") {
        return false;
    }
    else if (shape.closed !== true) {
        return false;
    }
    else if (shape.expression === undefined) {
        return false;
    }
    return (isBlankNodeConstraint(nodeConstraint) &&
        isProductExpression(shape.expression));
}
export function makeProductShape(id, type) {
    const expression = makeProductExpression(type);
    return {
        id: id,
        type: "ShapeAnd",
        shapeExprs: [
            blankNodeConstraint,
            { type: "Shape", closed: true, expression },
        ],
    };
}
function makeProductExpression(type) {
    const expressions = [anyType];
    const values = new Set();
    for (const { key, value } of type.components) {
        if (key === rdf.type) {
            throw new Error("Product object cannot have an rdf:type component");
        }
        else if (values.has(key)) {
            throw new Error("Product objects cannot repeat component values");
        }
        values.add(key);
        expressions.push({
            type: "TripleConstraint",
            predicate: key,
            valueExpr: value,
        });
    }
    return { type: "EachOf", expressions };
}
export function isComponentResult(result) {
    return (result.type === "TripleConstraintSolutions" && result.solutions.length === 1);
}
export function isProductResult(result, id) {
    if (result.type !== "ShapeAndResults") {
        return false;
    }
    else if (result.solutions.length !== 2) {
        return false;
    }
    const [nodeConstraint, shape] = result.solutions;
    if (shape.type !== "ShapeTest") {
        return false;
    }
    else if (shape.shape !== id) {
        return false;
    }
    else if (shape.solution.type !== "EachOfSolutions") {
        return false;
    }
    else if (shape.solution.solutions.length !== 1) {
        return false;
    }
    const [{ expressions }] = shape.solution.solutions;
    const [first, ...rest] = expressions;
    return (isBlankNodeConstraintResult(nodeConstraint) &&
        nodeConstraint.shape === id &&
        isAnyTypeResult(first) &&
        rest.every(isComponentResult));
}
export function parseProductResult(result) {
    const [{}, shape] = result.solutions;
    const [{ expressions }] = shape.solution.solutions;
    const [{}, ...rest] = expressions;
    return rest;
}
//# sourceMappingURL=product.js.map