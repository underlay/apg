import { forEntries, Schema } from "@underlay/apg"

import ShExParser from "shex/packages/shex-parser"

import { makeUriShape } from "./uri.js"
import { makeLabelShape } from "./label.js"
import { makeLiteralShape } from "./literal.js"
import { makeProductShape } from "./product.js"
import { makeCoproductShape } from "./coproduct.js"

import { signalInvalidType } from "./utils.js"

export function makeShExSchema(
	typeCache: Map<Exclude<Schema.Type, Schema.Reference>, string>,
	schema: Schema.Schema
): ShExParser.Schema {
	const shapes: ({ id: string } & ShExParser.shapeExprObject)[] = []

	for (const [type, id] of typeCache) {
		shapes.push(makeShapeExpr(id, type, typeCache))
	}

	for (const [key, value, index] of forEntries(schema)) {
		shapes.push(makeLabelShape(`_:l${index}`, key, value, typeCache))
	}

	return { type: "Schema", shapes }
}

function makeShapeExpr(
	id: string,
	type: Exclude<Schema.Type, Schema.Reference>,
	typeCache: Map<Exclude<Schema.Type, Schema.Reference>, string>
): { id: string } & ShExParser.shapeExprObject {
	if (type.type === "uri") {
		return makeUriShape(id, type)
	} else if (type.type === "literal") {
		return makeLiteralShape(id, type)
	} else if (type.type === "product") {
		return makeProductShape(id, type, typeCache)
	} else if (type.type === "coproduct") {
		return makeCoproductShape(id, type, typeCache)
	} else {
		signalInvalidType(type)
	}
}
