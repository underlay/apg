import { getBlankNodeId } from "./utils.js";
export const isLiteralShape = (shapeExpr) => typeof shapeExpr !== "string" &&
    shapeExpr.type === "NodeConstraint" &&
    shapeExpr.hasOwnProperty("datatype");
export function isLiteralResult(result, value) {
    return (result.type === "NodeConstraintTest" &&
        result.shape === getBlankNodeId(value) &&
        isLiteralShape(result.shapeExpr));
}
export function makeLiteralShape(id, { type, datatype, ...rest }) {
    return { id: getBlankNodeId(id), type: "NodeConstraint", datatype, ...rest };
}
//# sourceMappingURL=literal.js.map