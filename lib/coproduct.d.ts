/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult, EachOfSolutions, OneOfSolutions, TripleConstraintSolutions } from "@shexjs/validator";
import APG from "./apg.js";
import { anyType, anyTypeResult, BlankNodeConstraint, BlankNodeConstraintResult } from "./utils.js";
export declare type CoproductShape = {
    id: string;
    type: "ShapeAnd";
    shapeExprs: [BlankNodeConstraint, {
        type: "Shape";
        closed: true;
        expression: CoproductExpression;
    }];
};
export declare type CoproductExpression = {
    type: "EachOf";
    expressions: [anyType, {
        type: "OneOf";
        expressions: OptionExpression[];
    }];
};
export declare type OptionExpression = {
    id: string;
    type: "TripleConstraint";
    predicate: string;
    valueExpr: string;
};
export declare function makeCoproductShape(id: string, type: APG.Coproduct, typeCache: Map<Exclude<APG.Type, APG.Reference>, string>): CoproductShape;
export declare type CoproductResult = {
    type: "ShapeAndResults";
    solutions: [BlankNodeConstraintResult, {
        type: "ShapeTest";
        node: string;
        shape: string;
        solution: {
            type: "EachOfSolutions";
            solutions: [{
                type: "EachOfSolution";
                expressions: [anyTypeResult, {
                    type: "OneOfSolutions";
                    solutions: [{
                        type: "OneOfSolution";
                        expressions: [OptionResult];
                    }];
                }];
            }];
        };
    }];
};
export declare type OptionResult = {
    type: "TripleConstraintSolutions";
    predicate: string;
    valueExpr: string;
    productionLabel: string;
    solutions: [{
        type: "TestedTriple";
        subject: string;
        predicate: string;
        object: ShExParser.objectValue;
        referenced?: SuccessResult;
    }];
};
export declare function isOptionResult(result: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions): result is OptionResult;
export declare function isCoproductResult(result: SuccessResult, id: string): result is CoproductResult;
export declare const parseCoproductResult: (result: CoproductResult) => OptionResult;
