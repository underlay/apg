import { getBlankNodeId, isNodeConstraint } from "./utils.js";
export const isIriShape = (shapeExpr) => isNodeConstraint(shapeExpr) &&
    shapeExpr.nodeKind === "iri" &&
    shapeExpr.hasOwnProperty("id");
export function isIriResult(result, value) {
    return (result.type === "NodeConstraintTest" &&
        result.shape === getBlankNodeId(value) &&
        isIriShape(result.shapeExpr));
}
export function makeIriShape(id, { type, ...rest }) {
    return {
        id: getBlankNodeId(id),
        type: "NodeConstraint",
        nodeKind: "iri",
        ...rest,
    };
}
//# sourceMappingURL=iri.js.map