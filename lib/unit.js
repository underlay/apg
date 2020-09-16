import { isBlankNodeConstraint, isBlankNodeConstraintResult, anyType, isAnyTypeResult, blankNodeConstraint, } from "./utils.js";
export const emptyShape = {
    type: "Shape",
    closed: true,
    expression: anyType,
};
export function isEmptyShape(shapeExpr) {
    return shapeExpr === emptyShape;
}
export const unitShapeExpr = {
    type: "ShapeAnd",
    shapeExprs: [blankNodeConstraint, emptyShape],
};
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
export function isEmptyShapeResult(result) {
    return result.type === "ShapeTest" && isAnyTypeResult(result.solution);
}
export function isUnitShapeResult(result) {
    if (result.type !== "ShapeAndResults") {
        return false;
    }
    else if (result.solutions.length !== 2) {
        return false;
    }
    const [nodeConstraint, shape] = result.solutions;
    return (isBlankNodeConstraintResult(nodeConstraint) && isEmptyShapeResult(shape));
}
//# sourceMappingURL=unit.js.map