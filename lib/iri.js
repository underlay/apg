import { isNamedNodeConstraint } from "./utils.js";
import { emptyShape, isEmptyShapeResult } from "./unit.js";
import { isEmptyShape } from "./unit.js";
export function isIriShape(shapeExpr) {
    if (typeof shapeExpr !== "string" &&
        shapeExpr.type === "ShapeAnd" &&
        shapeExpr.shapeExprs.length === 2) {
        const [nodeConstraint, shape] = shapeExpr.shapeExprs;
        // console.log(
        // 	"okay",
        // 	isNamedNodeConstraint(nodeConstraint),
        // 	isEmptyShape(shape)
        // )
        return isNamedNodeConstraint(nodeConstraint) && isEmptyShape(shape);
    }
    return false;
}
export function parseIriShape(shapeExpr) {
    const [nodeConstraint] = shapeExpr.shapeExprs;
    return nodeConstraint;
}
export function isNamedNodeConstraintResult(result) {
    return (result.type === "NodeConstraintTest" &&
        isNamedNodeConstraint(result.shapeExpr));
}
export function isIriResult(result) {
    if (result.type === "ShapeAndResults" && result.solutions.length === 2) {
        const [nodeTest, shape] = result.solutions;
        return isNamedNodeConstraintResult(nodeTest) && isEmptyShapeResult(shape);
    }
    return false;
}
export function makeIriShape({ type, ...rest }) {
    return {
        type: "ShapeAnd",
        shapeExprs: [
            { type: "NodeConstraint", nodeKind: "iri", ...rest },
            emptyShape,
        ],
    };
}
//# sourceMappingURL=iri.js.map