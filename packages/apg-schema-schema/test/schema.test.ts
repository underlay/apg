import schemaSchema, { fromSchema, toSchema } from ".."

import { isTypeEqual, validateValue, getKeys, zip } from "@underlay/apg"
import { ul } from "@underlay/namespaces"

test("Round-trip schema schema to instance and back", () => {
	const instance = fromSchema(schemaSchema)

	for (const key of getKeys(schemaSchema)) {
		for (const value of instance[key]) {
			expect(validateValue(schemaSchema[key], value))
		}
	}

	// Make sure that only one value type got instantiated
	const coproducts = schemaSchema[ul.coproduct]
	expect(coproducts).toBeDefined()
	expect(instance[ul.coproduct]).toBeDefined()
	expect(instance[ul.coproduct].length).toBe(1)

	const schema = toSchema(instance)

	for (const [a, b] of zip(getKeys(schema), getKeys(schemaSchema))) {
		expect(a).toBe(b)
		expect(isTypeEqual(schema[a], schemaSchema[b])).toBe(true)
	}
})
