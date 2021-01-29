import { xsd } from "@underlay/namespaces"

import { Schema } from "@underlay/apg"
import { ul } from "@underlay/namespaces"

// 0. case

export const caseLabel = Schema.product({
	[ul.key]: Schema.uri(),
	[ul.source]: Schema.reference(ul.match),
	[ul.value]: Schema.reference(ul.expression),
})

// 1. expression

export const expression = Schema.coproduct({
	[ul.constant]: Schema.product({
		[ul.datatype]: Schema.uri(),
		[ul.value]: Schema.literal(xsd.string),
	}),
	[ul.dereference]: Schema.uri(),
	[ul.identifier]: Schema.uri(),
	[ul.injection]: Schema.uri(),
	[ul.match]: Schema.reference(ul.match),
	[ul.projection]: Schema.uri(),
	[ul.tuple]: Schema.reference(ul.tuple),
})

export const expressionLabel = Schema.coproduct({
	[ul.none]: Schema.product({}),
	[ul.some]: Schema.product({
		[ul.head]: expression,
		[ul.tail]: Schema.reference(ul.expression),
	}),
})

// 2. map

export const mapLabel = Schema.product({
	[ul.key]: Schema.uri(),
	[ul.source]: Schema.uri(),
	[ul.value]: Schema.reference(ul.expression),
})

// 3. match

export const matchLabel = Schema.product({})

// 4. slot

export const slotLabel = Schema.product({
	[ul.key]: Schema.uri(),
	[ul.source]: Schema.reference(ul.tuple),
	[ul.value]: Schema.reference(ul.expression),
})

// 5. tuple

export const tupleLabel = Schema.product({})

const mappingSchema = Schema.schema({
	[ul.CASE]: caseLabel,
	[ul.expression]: expressionLabel,
	[ul.map]: mapLabel,
	[ul.match]: matchLabel,
	[ul.slot]: slotLabel,
	[ul.tuple]: tupleLabel,
})

export type MappingSchema = typeof mappingSchema

export default mappingSchema
