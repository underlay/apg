import { xsd } from "n3.ts"

import * as APG from "../../apg.js"
import * as ns from "../../namespace.js"

// 0. case

const caseLabel = APG.product({
	[ns.key]: APG.uri(),
	[ns.source]: APG.reference(ns.match),
	[ns.value]: APG.reference(ns.expression),
})

// 1. expression

const expression = APG.coproduct({
	[ns.constant]: APG.product({
		[ns.datatype]: APG.uri(),
		[ns.value]: APG.literal(xsd.string),
	}),
	[ns.dereference]: APG.uri(),
	[ns.identifier]: APG.uri(),
	[ns.injection]: APG.uri(),
	[ns.match]: APG.reference(ns.match),
	[ns.projection]: APG.uri(),
	[ns.tuple]: APG.reference(ns.tuple),
})

const expressionLabel = APG.coproduct({
	[ns.none]: APG.product({}),
	[ns.some]: APG.product({
		[ns.head]: expression,
		[ns.tail]: APG.reference(ns.expression),
	}),
})

// 2. map

const mapLabel = APG.product({
	[ns.key]: APG.uri(),
	[ns.source]: APG.uri(),
	[ns.value]: APG.reference(ns.expression),
})

// 3. match

const matchLabel = APG.product({})

// 4. slot

const slotLabel = APG.product({
	[ns.key]: APG.uri(),
	[ns.source]: APG.reference(ns.tuple),
	[ns.value]: APG.reference(ns.expression),
})

// 5. tuple

const tupleLabel = APG.product({})

const mappingSchema = APG.schema({
	[ns.CASE]: caseLabel,
	[ns.expression]: expressionLabel,
	[ns.map]: mapLabel,
	[ns.match]: matchLabel,
	[ns.slot]: slotLabel,
	[ns.tuple]: tupleLabel,
})

export default mappingSchema
