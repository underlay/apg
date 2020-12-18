import { APG, ns } from "../../index.js"

export const value = APG.coproduct({
	[ns.reference]: APG.reference(ns.label),
	[ns.uri]: APG.product({}),
	[ns.literal]: APG.uri(),
	[ns.product]: APG.reference(ns.product),
	[ns.coproduct]: APG.reference(ns.coproduct),
})

// Label
export const label = APG.product({
	[ns.key]: APG.uri(),
	[ns.value]: value,
})

// Product
export const product = APG.product({})

// Component
export const component = APG.product({
	[ns.key]: APG.uri(),
	[ns.source]: APG.reference(ns.product),
	[ns.value]: value,
})

// Coproduct
export const coproduct = APG.product({})

// Option
export const option = APG.product({
	[ns.key]: APG.uri(),
	[ns.source]: APG.reference(ns.coproduct),
	[ns.value]: value,
})

const schemaSchema = APG.schema({
	[ns.label]: label,
	[ns.product]: product,
	[ns.component]: component,
	[ns.coproduct]: coproduct,
	[ns.option]: option,
})

export type SchemaSchema = typeof schemaSchema

export default schemaSchema
