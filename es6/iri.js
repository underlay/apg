import { isNodeConstraint } from "./utils.js";
export const isIriShape = (shapeExpr) => isNodeConstraint(shapeExpr) &&
    shapeExpr.nodeKind === "iri" &&
    shapeExpr.hasOwnProperty("id");
export function isIriResult(result, id) {
    return (result.type === "NodeConstraintTest" &&
        result.shape === id &&
        isIriShape(result.shapeExpr));
}
export function makeIriShape(id, {}) {
    return {
        id: id,
        type: "NodeConstraint",
        nodeKind: "iri",
    };
}
//# sourceMappingURL=iri.js.map