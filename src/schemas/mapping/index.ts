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

const expressionLabel = APG.coproduct({
	[ns.constant]: APG.product({
		[ns.datatype]: APG.uri(),
		[ns.value]: APG.literal(xsd.string),
	}),
	[ns.dereference]: APG.uri(),
	[ns.identifier]: APG.uri(),
	[ns.identity]: APG.product({}),
	[ns.injection]: APG.product({
		[ns.key]: APG.uri(),
		[ns.value]: APG.reference(ns.expression),
	}),
	[ns.match]: APG.reference(ns.match),
	[ns.projection]: APG.uri(),
	[ns.tuple]: APG.reference(ns.tuple),
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
