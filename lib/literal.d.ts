/// <reference types="shexjs" />
import { SuccessResult } from "@shexjs/validator";
import ShExParser from "@shexjs/parser";
import APG from "./apg.js";
declare type literalShape = {
    id: string;
    type: "NodeConstraint";
    datatype: string;
};
declare type patternLiteralShape = literalShape & {
    pattern: string;
    flags: string;
};
export declare type LiteralShape = literalShape | patternLiteralShape;
export declare const isLiteralShape: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is LiteralShape;
export declare type LiteralResult = {
    type: "NodeConstraintTest";
    node: string;
    shape: string;
    shapeExpr: LiteralShape;
};
export declare function isLiteralResult(result: SuccessResult, id: string): result is LiteralResult;
export declare function makeLiteralShape(id: string, { datatype }: APG.Literal): LiteralShape;
export {};
