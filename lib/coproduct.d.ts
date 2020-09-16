/// <reference types="shexjs" />
import ShExParser from "@shexjs/parser";
import { SuccessResult, ShapeOrResults } from "@shexjs/validator";
import { Type, CoproductType } from "./schema.js";
export declare function isShapeOrResult(result: SuccessResult): result is ShapeOrResults;
export declare function isShapeOr(shapeExpr: ShExParser.shapeExpr): shapeExpr is ShExParser.ShapeOr;
export declare function makeCoproductShape(type: CoproductType, makeShapeExpr: (type: Type) => ShExParser.shapeExpr): ShExParser.ShapeOr;
export declare function matchResultOption(result: SuccessResult, shapeExprs: ShExParser.shapeExpr[]): number;
