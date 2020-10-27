import { rdf } from "n3.ts";
import { getBlankNodeId } from "./utils.js";
export function makeLabelShape(id, label, typeCache) {
    return {
        id: id,
        type: "ShapeAnd",
        shapeExprs: [
            {
                type: "Shape",
                extra: [rdf.type],
                expression: {
                    type: "TripleConstraint",
                    predicate: rdf.type,
                    valueExpr: {
                        type: "NodeConstraint",
                        values: [label.key],
                    },
                },
            },
            getBlankNodeId(label.value, typeCache),
        ],
    };
}
export function isLabelResult(result, id, key) {
    if (result.type !== "ShapeAndResults") {
        return false;
    }
    else if (result.solutions.length !== 2) {
        return false;
    }
    const [shape] = result.solutions;
    if (shape.type !== "ShapeTest") {
        return false;
    }
    else if (shape.shape !== id) {
        return false;
    }
    else if (shape.solution.type !== "TripleConstraintSolutions") {
        return false;
    }
    else if (shape.solution.predicate !== rdf.type) {
        return false;
    }
    else if (shape.solution.solutions.length !== 1) {
        return false;
    }
    const [{ object, predicate }] = shape.solution.solutions;
    return object === key && predicate === rdf.type;
}
export function parseLabelResult(result) {
    const [{}, nextResult] = result.solutions;
    return nextResult;
}
//# sourceMappingURL=label.js.map