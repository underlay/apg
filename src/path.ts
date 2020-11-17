import APG from "./apg.js"

export function getType(
	schema: APG.Schema,
	[label, nil, ...path]: APG.Path
): APG.Type {
	if (isNaN(label) || label < 0 || label >= schema.length) {
		throw new Error("Invalid label index")
	} else if (!isNaN(nil)) {
		throw new Error("Invalid path")
	}

	const { value } = schema[label]

	return path.reduce((type: APG.Type, index: number): APG.Type => {
		if (type.type === "product" && index in type.components) {
			return type.components[index].value
		} else if (type.type === "coproduct" && -1 - index in type.options) {
			return type.options[-1 - index].value
		} else if (type.type === "reference" && isNaN(index)) {
			return schema[type.value].value
		} else {
			throw new Error("Invalid type index")
		}
	}, value)
}

export function* getValues(
	schema: APG.Schema,
	instance: APG.Instance,
	[label, nil, ...path]: APG.Path
): Generator<APG.Value, void, undefined> {
	if (isNaN(label) || label < 0 || label >= instance.length) {
		throw new Error("Invalid label index")
	} else if (!isNaN(nil)) {
		throw new Error("Invalid path")
	}

	const { value: type } = schema[label]
	for (const element of instance[label]) {
		const token = path.reduce(
			(
				token: [APG.Type, APG.Value] | null,
				index: number
			): [APG.Type, APG.Value] | null => {
				if (token === null) {
					return null
				}

				const [type, value] = token
				if (
					type.type === "product" &&
					index in type.components &&
					value.termType === "Record" &&
					index in value
				) {
					return [type.components[index].value, value[index]]
				} else if (
					type.type === "coproduct" &&
					-1 - index in type.options &&
					value.termType === "Variant"
				) {
					if (value.key === type.options[-1 - index].key) {
						return [type.options[-1 - index].value, value.value]
					} else {
						return null
					}
				} else if (
					type.type === "reference" &&
					type.value in schema &&
					type.value in instance &&
					value.termType === "Pointer" &&
					value.index in instance[type.value] &&
					isNaN(index)
				) {
					return [schema[type.value].value, instance[type.value][value.index]]
				} else {
					throw new Error("Invalid value index")
				}
			},
			[type, element]
		)

		if (token !== null) {
			const [{}, value] = token
			yield value
		}
	}
}
