import { isNodeConstraint } from "./utils.js";
export const isIriShape = (shapeExpr) => isNodeConstraint(shapeExpr) &&
    shapeExpr.nodeKind === "iri" &&
    shapeExpr.hasOwnProperty("id");
export function isIriResult(result, id) {
    return (result.type === "NodeConstraintTest" &&
        isIriShape(result.shapeExpr) &&
        result.shape === id);
}
export function makeIriShape(id, { id: {}, type, ...rest }) {
    return {
        id: id,
        type: "NodeConstraint",
        nodeKind: "iri",
        ...rest,
    };
}
//# sourceMappingURL=iri.js.map