import { rdf } from "n3.ts";
import { isBlankNodeConstraintResult, isAnyTypeResult, anyType, blankNodeConstraint, getBlankNodeId, } from "./utils.js";
export function makeProductShape(id, type) {
    console.log("making product shape", id, getBlankNodeId(id));
    const expression = makeProductExpression(type);
    return {
        id: getBlankNodeId(id),
        type: "ShapeAnd",
        shapeExprs: [
            blankNodeConstraint,
            { type: "Shape", closed: true, expression },
        ],
    };
}
function makeProductExpression(type) {
    const expressions = [anyType];
    const keys = new Set();
    for (const [id, { key, value }] of type.components) {
        if (key === rdf.type) {
            throw new Error("Product object cannot have an rdf:type component");
        }
        else if (keys.has(key)) {
            throw new Error("Product objects cannot repeat component keys");
        }
        keys.add(key);
        expressions.push({
            id: getBlankNodeId(id),
            type: "TripleConstraint",
            predicate: key,
            valueExpr: getBlankNodeId(value),
        });
    }
    return { type: "EachOf", expressions };
}
export function isComponentResult(result) {
    return (result.type === "TripleConstraintSolutions" && result.solutions.length === 1);
}
export function isProductResult(result, id) {
    const blankNodeId = getBlankNodeId(id);
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
    else if (shape.shape !== blankNodeId) {
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
        nodeConstraint.shape === blankNodeId &&
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