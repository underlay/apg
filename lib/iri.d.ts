/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult } from "@shexjs/validator";
import APG from "./apg.js";
declare type iriShape = {
    id: string;
    type: "NodeConstraint";
    nodeKind: "iri";
};
declare type patternIriShape = iriShape & {
    pattern: string;
    flags: string;
};
export declare type IriShape = iriShape | patternIriShape;
export declare const isIriShape: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is IriShape;
export declare type IriResult = {
    type: "NodeConstraintTest";
    node: string;
    shape: string;
    shapeExpr: IriShape;
};
export declare function isIriResult(result: SuccessResult, value: string | APG.Reference): result is IriResult;
export declare function makeIriShape(id: string, { type, ...rest }: APG.Iri): IriShape;
export {};
