import zip from "ziterable"
import schemaSchema from "../lib/schemas/schema/index.js"
import { fromSchema, toSchema } from "../lib/schemas/schema/parse.js"

import { isTypeEqual, validateValue, getKeys, ns } from ".."

test("Round-trip schema schema to instance and back", () => {
	const instance = fromSchema(schemaSchema)

	for (const key of getKeys(schemaSchema)) {
		for (const value of instance[key]) {
			expect(validateValue(schemaSchema[key], value))
		}
	}

	// Make sure that only one value type got instantiated
	const coproducts = schemaSchema[ns.coproduct]
	expect(coproducts).toBeDefined()
	expect(instance[ns.coproduct]).toBeDefined()
	expect(instance[ns.coproduct].length).toBe(1)

	const schema = toSchema(instance)

	for (const [a, b] of zip(getKeys(schema), getKeys(schemaSchema))) {
		expect(a).toBe(b)
		expect(isTypeEqual(schema[a], schemaSchema[b])).toBe(true)
	}
})
