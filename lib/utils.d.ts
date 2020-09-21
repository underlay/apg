/// <reference types="shexjs" />
import { NamedNode, BlankNode, Literal } from "n3.ts";
import ShExParser from "@shexjs/parser";
import { EachOfSolutions, OneOfSolutions, TripleConstraintSolutions, SuccessResult } from "@shexjs/validator";
declare const rdfType: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
export declare const zip: <A, B>(a: Iterable<A>, b: Iterable<B>) => Iterable<[A, B, number]>;
export declare function parseObjectValue(object: ShExParser.objectValue): Literal | NamedNode<string> | BlankNode;
export interface anyType extends ShExParser.TripleConstraint<typeof rdfType, undefined> {
    min: 0;
    max: -1;
}
export declare const anyType: anyType;
export declare function isAnyType(tripleExpr: ShExParser.tripleExpr): tripleExpr is anyType;
export declare type anyTypeResult = {
    type: "TripleConstraintSolutions";
    predicate: typeof rdfType;
    solutions: anyTypeTripleResult[];
};
export declare function isAnyTypeResult(solutions: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions): solutions is anyTypeResult;
declare type anyTypeTripleResult = {
    type: "TestedTriple";
    subject: string;
    predicate: typeof rdfType;
    object: string;
};
export declare const isNodeConstraint: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is {
    type: "NodeConstraint";
    nodeKind: "iri" | "bnode";
};
export declare type BlankNodeConstraint = {
    type: "NodeConstraint";
    nodeKind: "bnode";
};
export declare const blankNodeConstraint: BlankNodeConstraint;
export declare const isBlankNodeConstraint: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is BlankNodeConstraint;
export declare type BlankNodeConstraintResult = {
    type: "NodeConstraintTest";
    node: string;
    shape: string;
    shapeExpr: BlankNodeConstraint;
};
export declare function isBlankNodeConstraintResult(result: SuccessResult): result is BlankNodeConstraintResult;
export {};
