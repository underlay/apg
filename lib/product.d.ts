/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult, EachOfSolutions, OneOfSolutions, TripleConstraintSolutions } from "@shexjs/validator";
import APG from "./apg.js";
import { BlankNodeConstraintResult, anyTypeResult, BlankNodeConstraint, anyType } from "./utils.js";
export declare type ProductShape = {
    id: string;
    type: "ShapeAnd";
    shapeExprs: [
        BlankNodeConstraint,
        {
            type: "Shape";
            closed: true;
            expression: ProductExpression;
        }
    ];
};
export declare type ProductExpression = {
    type: "EachOf";
    expressions: [anyType, ...ComponentExpression[]];
};
export declare type ComponentExpression = {
    id: string;
    type: "TripleConstraint";
    predicate: string;
    valueExpr: string;
};
export declare function makeProductShape(id: string, type: APG.Product, typeCache: Map<Exclude<APG.Type, APG.Reference>, string>): ProductShape;
export declare type ComponentResult = {
    type: "TripleConstraintSolutions";
    predicate: string;
    valueExpr: string;
    productionLabel: string;
    solutions: [
        {
            type: "TestedTriple";
            subject: string;
            predicate: string;
            object: ShExParser.objectValue;
            referenced?: SuccessResult;
        }
    ];
};
export declare function isComponentResult(result: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions): result is ComponentResult;
export declare type ProductResult = {
    type: "ShapeAndResults";
    solutions: [
        BlankNodeConstraintResult,
        {
            type: "ShapeTest";
            node: string;
            shape: string;
            solution: {
                type: "EachOfSolutions";
                solutions: [
                    {
                        type: "EachOfSolution";
                        expressions: [anyTypeResult, ...ComponentResult[]];
                    }
                ];
            };
        }
    ];
};
export declare function isProductResult(result: SuccessResult, id: string): result is ProductResult;
export declare function parseProductResult(result: ProductResult): ComponentResult[];
