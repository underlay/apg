/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult, ShapeOrResults } from "@shexjs/validator";
import { APG } from "./schema.js";
export declare function isShapeOrResult(result: SuccessResult): result is ShapeOrResults;
export declare function isShapeOr(shapeExpr: ShExParser.shapeExpr): shapeExpr is ShExParser.ShapeOr;
export declare function makeCoproductShape(type: APG.Coproduct, makeShapeExpr: (type: APG.Type) => ShExParser.shapeExpr): ShExParser.ShapeOr;
export declare function matchResultOption(result: SuccessResult, shapeExprs: ShExParser.shapeExpr[]): number;
