import { zip } from "./utils.js";
import { isNilShapeResult, isNilShapeExpr } from "./nil.js";
import { isProductResult, parseProductResult, isProductShape, } from "./product.js";
import { isLiteralResult } from "./literal.js";
import { isIriResult, isIriShape } from "./iri.js";
import { isLabelResult, parseLabelResult } from "./reference.js";
export function isShapeOrResult(result) {
    return result.type === "ShapeOrResults";
}
export function isShapeOr(shapeExpr) {
    return typeof shapeExpr !== "string" && shapeExpr.type === "ShapeOr";
}
export function makeCoproductShape(type, makeShapeExpr) {
    return {
        type: "ShapeOr",
        shapeExprs: type.options.map(({ value }) => makeShapeExpr(value)),
    };
}
export function matchResultOption(result, shapeExprs) {
    // console.error("Matching result", isIriResult(result))
    // console.error(JSON.stringify(result, null, "  "))
    // console.error(JSON.stringify(shapeExprs, null, "  "))
    if (isNilShapeResult(result)) {
        return shapeExprs.findIndex(isNilShapeExpr);
    }
    else if (isLabelResult(result)) {
        const [{}, shape] = parseLabelResult(result);
        return shapeExprs.findIndex((shapeExpr) => shapeExpr === shape);
    }
    else if (isLiteralResult(result)) {
        // const { datatype } = result.shapeExpr
        return shapeExprs.indexOf(result.shapeExpr);
        // return shapeExprs.findIndex(
        // 	(shapeExpr) =>
        // 		isDatatypeConstraint(shapeExpr) && shapeExpr.datatype === datatype
        // )
    }
    else if (isIriResult(result)) {
        const [nodeTest] = result.solutions;
        return shapeExprs.findIndex((shapeExpr, i) => {
            if (isIriShape(shapeExpr)) {
                const [nodeConstraint] = shapeExpr.shapeExprs;
                return nodeConstraint === nodeTest.shapeExpr;
            }
            return false;
        });
    }
    else if (isProductResult(result)) {
        const entries = parseProductResult(result);
        return shapeExprs.findIndex((shapeExpr) => {
            if (isProductShape(shapeExpr)) {
                const [{}, shape] = shapeExpr.shapeExprs;
                const [{}, ...valueExprs] = shape.expression.expressions;
                for (const [expr, entry] of zip(valueExprs, entries)) {
                    if (expr.predicate !== entry.predicate) {
                        return false;
                    }
                    else if (expr.valueExpr !== entry.valueExpr) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        });
    }
    else if (result.type === "ShapeOrResults") {
        throw new Error("Nested ShapeOr encountered; this sould be normalized before parsing");
    }
    else {
        throw new Error("Invalid ShapeOrResults result");
    }
}
//# sourceMappingURL=coproduct.js.map