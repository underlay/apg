export const isLiteralShape = (shapeExpr) => typeof shapeExpr !== "string" &&
    shapeExpr.type === "NodeConstraint" &&
    shapeExpr.hasOwnProperty("datatype");
export function isLiteralResult(result, id) {
    return (result.type === "NodeConstraintTest" &&
        result.shape === id &&
        isLiteralShape(result.shapeExpr));
}
export function makeLiteralShape(id, { id: {}, type, datatype, ...rest }) {
    return { id: id, type: "NodeConstraint", datatype, ...rest };
}
//# sourceMappingURL=literal.js.map