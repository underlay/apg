/// <reference types="shexjs" />
import { rdf } from "n3.ts";
import { SuccessResult } from "@shexjs/validator";
import APG from "./apg.js";
export declare type LabelShape = {
    id: string;
    type: "ShapeAnd";
    shapeExprs: [{
        type: "Shape";
        extra: [typeof rdf.type];
        expression: {
            type: "TripleConstraint";
            predicate: typeof rdf.type;
            valueExpr: {
                type: "NodeConstraint";
                values: [string];
            };
        };
    }, string];
};
export declare function makeLabelShape(id: string, label: APG.Label, typeCache: Map<Exclude<APG.Type, APG.Reference>, string>): LabelShape;
export declare type LabelResult = {
    type: "ShapeAndResults";
    solutions: [{
        type: "ShapeTest";
        node: string;
        shape: string;
        solution: {
            type: "TripleConstraintSolutions";
            predicate: typeof rdf.type;
            solutions: [{
                type: "TestedTriple";
                subject: string;
                predicate: typeof rdf.type;
                object: string;
            }];
        };
    }, SuccessResult];
};
export declare function isLabelResult(result: SuccessResult, id: string, key: string): result is LabelResult;
export declare function parseLabelResult(result: LabelResult): SuccessResult;
