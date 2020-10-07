import { rdf } from "n3.ts";
import { anyType, blankNodeConstraint, getBlankNodeId, isAnyTypeResult, isBlankNodeConstraintResult, } from "./utils.js";
export function makeCoproductShape(id, type) {
    const expression = makeCoproductExpression(type);
    return {
        id: getBlankNodeId(id),
        type: "ShapeAnd",
        shapeExprs: [
            blankNodeConstraint,
            { type: "Shape", closed: true, expression },
        ],
    };
}
function makeCoproductExpression(type) {
    const expressions = [];
    const keys = new Set();
    for (const [id, { key, value }] of type.options) {
        if (key === rdf.type) {
            throw new Error("Coproduct object cannot have an rdf:type option");
        }
        else if (keys.has(key)) {
            throw new Error("Coproduct objects cannot repeat option keys");
        }
        keys.add(key);
        expressions.push({
            id: getBlankNodeId(id),
            type: "TripleConstraint",
            predicate: key,
            valueExpr: getBlankNodeId(value),
        });
    }
    return {
        type: "EachOf",
        expressions: [anyType, { type: "OneOf", expressions }],
    };
}
export function isOptionResult(result) {
    return (result.type === "TripleConstraintSolutions" &&
        result.solutions.length === 1 &&
        result.productionLabel !== undefined);
}
export function isCoproductResult(result, id) {
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
    if (expressions.length !== 2) {
        return false;
    }
    const [first, oneOf] = expressions;
    if (oneOf.type !== "OneOfSolutions") {
        return false;
    }
    else if (oneOf.solutions.length !== 1) {
        return false;
    }
    const [{ expressions: options }] = oneOf.solutions;
    if (options.length !== 1) {
        return false;
    }
    const [option] = options;
    return (isBlankNodeConstraintResult(nodeConstraint) &&
        nodeConstraint.shape === blankNodeId &&
        isAnyTypeResult(first) &&
        isOptionResult(option));
}
// lmao
export const parseCoproductResult = (result) => result.solutions[1].solution.solutions[0].expressions[1].solutions[0]
    .expressions[0];
//# sourceMappingURL=coproduct.js.map