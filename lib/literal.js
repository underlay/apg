import { isDatatypeConstraint } from "./utils.js";
export function isLiteralResult(result) {
    return (result.type === "NodeConstraintTest" &&
        isDatatypeConstraint(result.shapeExpr));
}
export function makeLiteralShape({ type, datatype, ...rest }) {
    return { type: "NodeConstraint", datatype, ...rest };
}
//# sourceMappingURL=literal.js.map