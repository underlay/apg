/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult } from "@shexjs/validator";
import { BlankNodeConstraint, BlankNodeConstraintResult, anyType, anyTypeResult } from "./utils.js";
export interface emptyShape extends ShExParser.Shape {
    closed: true;
    expression: anyType;
}
export declare const emptyShape: emptyShape;
export declare function isEmptyShape(shapeExpr: ShExParser.shapeExpr): shapeExpr is emptyShape;
declare type unitShapeExpr = {
    type: "ShapeAnd";
    shapeExprs: [BlankNodeConstraint, emptyShape];
};
export declare const unitShapeExpr: unitShapeExpr;
export declare function isUnitShapeExpr(shapeExpr: ShExParser.shapeExpr): shapeExpr is unitShapeExpr;
export declare type EmptyShapeResult = {
    type: "ShapeTest";
    node: string;
    shape: string;
    solution: anyTypeResult;
};
export declare function isEmptyShapeResult(result: SuccessResult): result is EmptyShapeResult;
export declare type UnitShapeResult = {
    type: "ShapeAndResults";
    solutions: [BlankNodeConstraintResult, EmptyShapeResult];
};
export declare function isUnitShapeResult(result: SuccessResult): result is UnitShapeResult;
export {};
