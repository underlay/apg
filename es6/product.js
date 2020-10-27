import { rdf } from "n3.ts";
import { isBlankNodeConstraintResult, isAnyTypeResult, anyType, blankNodeConstraint, getBlankNodeId, } from "./utils.js";
export function makeProductShape(id, type, typeCache) {
    const expression = makeProductExpression(id, type, typeCache);
    return {
        id: id,
        type: "ShapeAnd",
        shapeExprs: [
            blankNodeConstraint,
            { type: "Shape", closed: true, expression },
        ],
    };
}
function makeProductExpression(id, type, typeCache) {
    const expressions = [anyType];
    const keys = new Set();
    for (const [index, { key, value }] of type.components.entries()) {
        if (key === rdf.type) {
            throw new Error("Product object cannot have an rdf:type component");
        }
        else if (keys.has(key)) {
            throw new Error("Product objects cannot repeat component keys");
        }
        keys.add(key);
        expressions.push({
            id: `${id}-c${index}`,
            type: "TripleConstraint",
            predicate: key,
            valueExpr: getBlankNodeId(value, typeCache),
        });
    }
    return { type: "EachOf", expressions };
}
export function isComponentResult(result) {
    return (result.type === "TripleConstraintSolutions" &&
        result.solutions.length === 1 &&
        result.productionLabel !== undefined);
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