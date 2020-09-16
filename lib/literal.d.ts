/// <reference types="shexjs" />
import { SuccessResult } from "@shexjs/validator";
import { DatatypeConstraint } from "./utils.js";
import { APG } from "./schema.js";
export declare type LiteralResult = {
    type: "NodeConstraintTest";
    node: string;
    shape: string;
    shapeExpr: DatatypeConstraint;
};
export declare function isLiteralResult(result: SuccessResult): result is LiteralResult;
export declare type LiteralShape = DatatypeConstraint & ({} | {
    pattern: string;
    flags: string;
});
export declare function makeLiteralShape({ type, datatype, ...rest }: APG.Literal): LiteralShape;
