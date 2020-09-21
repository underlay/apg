export function isShapeOrResult(result) {
    return result.type === "ShapeOrResults";
}
export function isCoproductShape(shapeExpr) {
    return (typeof shapeExpr !== "string" &&
        shapeExpr.id !== undefined &&
        shapeExpr.type === "ShapeOr" &&
        shapeExpr.shapeExprs.every((shapeExpr) => typeof shapeExpr === "string"));
}
export function makeCoproductShape(id, type) {
    return {
        id,
        type: "ShapeOr",
        shapeExprs: type.options.map(({ value }) => value),
    };
}
//# sourceMappingURL=coproduct.js.map