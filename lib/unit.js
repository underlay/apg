import { isBlankNodeConstraint, isBlankNodeConstraintResult, anyType, isAnyTypeResult, blankNodeConstraint, } from "./utils.js";
const emptyShape = {
    type: "Shape",
    closed: true,
    expression: anyType,
};
function isEmptyShape(shapeExpr) {
    return shapeExpr === emptyShape;
}
export function makeUnitShape(id, {}) {
    return {
        id: id,
        type: "ShapeAnd",
        shapeExprs: [blankNodeConstraint, emptyShape],
    };
}
export function isUnitShapeExpr(shapeExpr) {
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
    return isBlankNodeConstraint(nodeConstraint) && isEmptyShape(shape);
}
function isEmptyShapeResult(result) {
    return result.type === "ShapeTest" && isAnyTypeResult(result.solution);
}
export function isUnitResult(result, id) {
    if (result.type !== "ShapeAndResults") {
        return false;
    }
    else if (result.solutions.length !== 2) {
        return false;
    }
    const [nodeConstraint, shape] = result.solutions;
    return (isBlankNodeConstraintResult(nodeConstraint) &&
        nodeConstraint.shape === id &&
        isEmptyShapeResult(shape) &&
        shape.shape === id);
}
//# sourceMappingURL=unit.js.map