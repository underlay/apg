import APG from "../../apg.js"
import * as ns from "../../namespace.js"
import { freezeType, getEntries } from "../../utils.js"

const anyValue: APG.Coproduct = {
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
const labelLabel: APG.Product = {
	type: "product",
	components: { [ns.key]: { type: "uri" }, [ns.value]: anyValue },
}

// Product
const productLabel: APG.Unit = { type: "unit" }

// Component
const componentLabel: APG.Product = {
	type: "product",
	components: {
		[ns.key]: { type: "uri" },
		[ns.source]: { type: "reference", value: ns.product },
		[ns.value]: anyValue,
	},
}

// Coproduct
const coproductLabel: APG.Unit = { type: "unit" }

// Option
const optionLabel: APG.Product = {
	type: "product",
	components: {
		[ns.key]: { type: "uri" },
		[ns.source]: { type: "reference", value: ns.coproduct },
		[ns.value]: anyValue,
	},
}

const schemaSchema = {
	[ns.label]: labelLabel,
	[ns.product]: productLabel,
	[ns.component]: componentLabel,
	[ns.coproduct]: coproductLabel,
	[ns.option]: optionLabel,
}

for (const [_, label] of getEntries(schemaSchema)) {
	freezeType(label)
}

Object.freeze(schemaSchema)

export default schemaSchema
