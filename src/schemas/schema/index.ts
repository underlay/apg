import APG from "../../apg.js"
import * as ns from "../../namespace.js"
import { freezeType, forEntries } from "../../utils.js"

export const value: APG.Coproduct = {
	type: "coproduct",
	options: {
		[ns.reference]: { type: "reference", value: ns.label },
		[ns.unit]: { type: "unit" },
		[ns.uri]: { type: "unit" },
		[ns.literal]: { type: "uri" },
		[ns.product]: { type: "reference", value: ns.product },
		[ns.coproduct]: { type: "reference", value: ns.coproduct },
	},
}

// Label
export const label: APG.Product = {
	type: "product",
	components: { [ns.key]: { type: "uri" }, [ns.value]: value },
}

// Product
export const product: APG.Unit = { type: "unit" }

// Component
export const component: APG.Product = {
	type: "product",
	components: {
		[ns.key]: { type: "uri" },
		[ns.source]: { type: "reference", value: ns.product },
		[ns.value]: value,
	},
}

// Coproduct
export const coproduct: APG.Unit = { type: "unit" }

// Option
export const option: APG.Product = {
	type: "product",
	components: {
		[ns.key]: { type: "uri" },
		[ns.source]: { type: "reference", value: ns.coproduct },
		[ns.value]: value,
	},
}

const schemaSchema = {
	[ns.label]: label,
	[ns.product]: product,
	[ns.component]: component,
	[ns.coproduct]: coproduct,
	[ns.option]: option,
}

for (const [_, label] of forEntries(schemaSchema)) {
	freezeType(label)
}

Object.freeze(schemaSchema)

export default schemaSchema
