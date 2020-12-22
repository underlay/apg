import * as APG from "./apg.js"
import { getKeys } from "./utils.js"

export default function diff(a: APG.Schema, b: APG.Schema): null | APG.Mapping {
	for (const key in getKeys(a)) {
		if (key in b) {
			diffTypes(a[key], b[key])
		}
	}

	return null
}

function diffTypes(a: APG.Type, b: APG.Type): null | APG.Expression[] {
	// if (b.type === "unit") {
	// 	return [{ type: "terminal" }]
	// } else if (b.type === "uri") {
	// 	// if (a.type === )
	// }
	return null
}
