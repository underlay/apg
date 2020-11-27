import zip from "ziterable"
import schemaSchema from "../es6/schemas/schema/index.js"
import { fromSchema, toSchema } from "../es6/schemas/schema/parse.js"
import { isTypeEqual } from "../es6/type.js"
import { validateValue } from "../es6/value.js"
import { getKeys } from "../es6/utils.js"
import * as ns from "../es6/namespace.js"

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
