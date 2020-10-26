/// <reference types="shexjs" />
import { NamedNode, BlankNode, Literal, rdf } from "n3.ts";
import ShExParser from "@shexjs/parser";
import { EachOfSolutions, OneOfSolutions, TripleConstraintSolutions, SuccessResult } from "@shexjs/validator";
import APG from "./apg.js";
export declare function signalInvalidType(type: never): never;
export declare function forType(type: APG.Type, stack?: APG.Type[]): Generator<[APG.Type, APG.Type[]], void, undefined>;
export declare function forValue(value: APG.Value): Generator<[APG.Value], void, undefined>;
export declare const getBlankNodeId: (type: APG.Type, typeCache: Map<Exclude<APG.Type, APG.Reference>, string>) => string;
export declare function equal(a: APG.Type, b: APG.Type): boolean;
declare type Iterate<E> = E extends Iterable<any>[] ? {
    [k in keyof E]: E[k] extends Iterable<infer T> ? T : E[k];
} : never;
export declare const zip: <E extends Iterable<any>[]>(...args: E) => Iterable<[...Iterate<E>, number]>;
export declare function parseObjectValue(object: ShExParser.objectValue): BlankNode | NamedNode<string> | Literal<string>;
export interface anyType extends ShExParser.TripleConstraint<typeof rdf.type, undefined> {
    min: 0;
    max: -1;
}
export declare const anyType: anyType;
export declare function isAnyType(tripleExpr: ShExParser.tripleExpr): tripleExpr is anyType;
export declare type anyTypeResult = {
    type: "TripleConstraintSolutions";
    predicate: typeof rdf.type;
    solutions: anyTypeTripleResult[];
};
export declare function isAnyTypeResult(solutions: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions): solutions is anyTypeResult;
declare type anyTypeTripleResult = {
    type: "TestedTriple";
    subject: string;
    predicate: typeof rdf.type;
    object: string;
};
export declare const isNodeConstraint: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is {
    type: "NodeConstraint";
    nodeKind: "bnode" | "iri";
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
