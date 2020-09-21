/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult, ShapeOrResults } from "@shexjs/validator";
import { APG } from "./apg.js";
export declare function isShapeOrResult(result: SuccessResult): result is ShapeOrResults;
export declare type CoproductShape = {
    id: string;
    type: "ShapeOr";
    shapeExprs: string[];
};
export declare function isCoproductShape(shapeExpr: ShExParser.shapeExpr): shapeExpr is CoproductShape;
export declare function makeCoproductShape(id: string, type: APG.Coproduct): CoproductShape;
