import { Schema } from "@underlay/apg"
import { ul } from "@underlay/namespaces"

export const value = Schema.coproduct({
	[ul.reference]: Schema.reference(ul.label),
	[ul.uri]: Schema.product({}),
	[ul.literal]: Schema.uri(),
	[ul.product]: Schema.reference(ul.product),
	[ul.coproduct]: Schema.reference(ul.coproduct),
})

// Label
export const label = Schema.product({
	[ul.key]: Schema.uri(),
	[ul.value]: value,
})

// Product
export const product = Schema.product({})

// Component
export const component = Schema.product({
	[ul.key]: Schema.uri(),
	[ul.source]: Schema.reference(ul.product),
	[ul.value]: value,
})

// Coproduct
export const coproduct = Schema.product({})

// Option
export const option = Schema.product({
	[ul.key]: Schema.uri(),
	[ul.source]: Schema.reference(ul.coproduct),
	[ul.value]: value,
})

const schemaSchema = Schema.schema({
	[ul.label]: label,
	[ul.product]: product,
	[ul.component]: component,
	[ul.coproduct]: coproduct,
	[ul.option]: option,
})

export type SchemaSchema = typeof schemaSchema

export default schemaSchema
