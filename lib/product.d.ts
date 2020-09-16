/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult, EachOfSolutions, OneOfSolutions, TripleConstraintSolutions } from "@shexjs/validator";
import { APG } from "./schema.js";
import { BlankNodeConstraintResult, anyTypeResult, BlankNodeConstraint, anyType } from "./utils.js";
export declare type ProductShape = {
    type: "ShapeAnd";
    shapeExprs: [BlankNodeConstraint, {
        type: "Shape";
        closed: true;
        expression: ProductExpression;
    }];
};
export declare type ProductExpression = {
    type: "EachOf";
    expressions: [anyType, ...ComponentExpression[]];
};
export declare type ComponentExpression = {
    type: "TripleConstraint";
    predicate: string;
    valueExpr: ShExParser.shapeExpr;
};
export declare function isProductShape(shapeExpr: ShExParser.shapeExpr): shapeExpr is ProductShape;
export declare function makeProductShape(type: APG.Product, makeShapeExpr: (type: APG.Type) => ShExParser.shapeExpr): ProductShape;
export declare type ComponentResult = {
    type: "TripleConstraintSolutions";
    predicate: string;
    valueExpr: ShExParser.shapeExpr;
    solutions: [{
        type: "TestedTriple";
        subject: string;
        predicate: string;
        object: ShExParser.objectValue;
        referenced?: SuccessResult;
    }];
};
export declare function isComponentResult(result: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions): result is ComponentResult;
export declare type ProductResult = {
    type: "ShapeAndResults";
    solutions: [BlankNodeConstraintResult, {
        type: "ShapeTest";
        node: string;
        shape: string;
        solution: {
            type: "EachOfSolutions";
            solutions: [{
                type: "EachOfSolution";
                expressions: [anyTypeResult, ...ComponentResult[]];
            }];
        };
    }];
};
export declare function isProductResult(result: SuccessResult): result is ProductResult;
export declare function parseProductResult(result: ProductResult): ComponentResult[];
