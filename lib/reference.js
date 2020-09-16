import { rdf } from "n3.ts";
export function makeLabelShape(type, value) {
    return {
        id: type.id,
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
                        values: [type.key],
                    },
                },
            },
            value,
        ],
    };
}
export function isLabelResult(result) {
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
    return predicate === rdf.type && typeof object === "string";
}
export function parseLabelResult(result) {
    const [{ solution, shape }, nextResult] = result.solutions;
    const [{ object }] = solution.solutions;
    return [object, shape, nextResult];
}
//# sourceMappingURL=reference.js.map