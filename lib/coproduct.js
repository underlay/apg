import { getBlankNodeId } from "./utils.js";
export function isShapeOrResult(result) {
    return result.type === "ShapeOrResults";
}
export function makeCoproductShape(id, type) {
    return {
        id: getBlankNodeId(id),
        type: "ShapeOr",
        shapeExprs: Array.from(type.options.values()).map(({ value }) => getBlankNodeId(value)),
    };
}
//# sourceMappingURL=coproduct.js.map