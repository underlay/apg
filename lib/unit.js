import { isBlankNodeConstraintResult, anyType, isAnyTypeResult, blankNodeConstraint, } from "./utils.js";
const emptyShape = {
    type: "Shape",
    closed: true,
    expression: anyType,
};
export function makeUnitShape(id, {}) {
    return {
        id: id,
        type: "ShapeAnd",
        shapeExprs: [blankNodeConstraint, emptyShape],
    };
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
function isEmptyShapeResult(result) {
    return result.type === "ShapeTest" && isAnyTypeResult(result.solution);
}
//# sourceMappingURL=unit.js.map