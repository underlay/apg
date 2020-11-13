import zip from "ziterable"
import schemaSchema from "../es6/bootstrap.js"
import { fromSchema, toSchema } from "../es6/schema.js"
import { typeEqual } from "../es6/type.js"
import { validateValue } from "../es6/value.js"
import * as ns from "../es6/namespace.js"

test("Round-trip schema schema to instance and back", () => {
	const instance = fromSchema(schemaSchema)

	for (const [{ value: type }, values] of zip(schemaSchema, instance)) {
		for (const value of values) {
			expect(validateValue(value, type)).toBe(true)
		}
	}

	// Make sure that only one value type got instantiated
	const variantIndex = schemaSchema.findIndex(({ key }) => key === ns.coproduct)
	expect(variantIndex).toBeGreaterThanOrEqual(0)
	expect(variantIndex).toBeLessThan(instance.length)
	expect(instance[variantIndex].length).toBe(1)

	const schema = toSchema(instance)
	for (const [a, b] of zip(schema, schemaSchema)) {
		expect(a.key).toBe(b.key)
		expect(typeEqual(a.value, b.value)).toBe(true)
	}
})
