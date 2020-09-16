import { SuccessResult } from "@shexjs/validator"

import { DatatypeConstraint, isDatatypeConstraint } from "./utils.js"
import { LiteralType } from "./schema.js"

export type LiteralResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: DatatypeConstraint
}

export function isLiteralResult(
	result: SuccessResult
): result is LiteralResult {
	return (
		result.type === "NodeConstraintTest" &&
		isDatatypeConstraint(result.shapeExpr)
	)
}

export type LiteralShape = DatatypeConstraint &
	({} | { pattern: string; flags: string })

export function makeLiteralShape({
	type,
	datatype,
	...rest
}: LiteralType): LiteralShape {
	return { type: "NodeConstraint", datatype, ...rest }
}
