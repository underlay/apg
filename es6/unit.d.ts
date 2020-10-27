/// <reference types="shexjs" />
import { SuccessResult } from "@shexjs/validator";
import { BlankNodeConstraint, BlankNodeConstraintResult, anyType, anyTypeResult } from "./utils.js";
import APG from "./apg.js";
declare type emptyShape = {
    type: "Shape";
    closed: true;
    expression: anyType;
};
declare const emptyShape: emptyShape;
export declare type UnitShape = {
    id: string;
    type: "ShapeAnd";
    shapeExprs: [BlankNodeConstraint, emptyShape];
};
export declare function makeUnitShape(id: string, {}: APG.Unit): UnitShape;
declare type EmptyShapeResult = {
    type: "ShapeTest";
    node: string;
    shape: string;
    solution: anyTypeResult;
};
export declare type UnitResult = {
    type: "ShapeAndResults";
    solutions: [BlankNodeConstraintResult, EmptyShapeResult];
};
export declare function isUnitResult(result: SuccessResult, id: string): result is UnitResult;
export {};
