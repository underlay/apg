import { BlankNode } from "n3.ts"
import { v4 as uuid } from "uuid"
import APG from "./apg"

const keyMap = new WeakMap<
	Readonly<{ [key: string]: any }>,
	readonly string[]
>()

export function* forEntries<T>(
	object: Readonly<{ [key: string]: T }>
): Generator<[string, T], void, undefined> {
	for (const key of getKeys(object)) {
		yield [key, object[key]]
	}
}

export function getKeys(
	object: Readonly<{ [key: string]: any }>
): readonly string[] {
	if (keyMap.has(object)) {
		return keyMap.get(object)!
	} else {
		const keys = Object.keys(object).sort()
		Object.freeze(keys)
		keyMap.set(object, keys)
		return keys
	}
}

export function getKeyIndex(
	object: Readonly<{ [key: string]: any }>,
	key: string
) {
	if (keyMap.has(object)) {
		const index = keyMap.get(object)!.indexOf(key)
		if (index === -1) {
			throw new Error(`Key not found: ${key}`)
		}
		return index
	} else {
		const keys = Object.keys(object).sort()
		Object.freeze(keys)
		keyMap.set(object, keys)
		const index = keys.indexOf(key)
		if (index === -1) {
			throw new Error(`Key not found: ${key}`)
		}
		return index
	}
}

export function mapKeys<S, T>(
	object: Readonly<{ [key: string]: S }>,
	map: (value: S, key: string) => T
) {
	const keys = getKeys(object)
	const result = Object.fromEntries(
		keys.map((key) => [key, map(object[key], key)])
	)
	keyMap.set(result, keys)
	Object.freeze(result)
	return result
}

export function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error("Invalid type")
}

export const rootId = uuid()

export type ID = () => BlankNode
export function getID(): ID {
	let id = 0
	return () => new BlankNode(`b${id++}`)
}

export function freezeType(type: APG.Type) {
	if (type.type === "product") {
		for (const [_, value] of forEntries(type.components)) {
			freezeType(value)
		}
		Object.freeze(type.components)
	} else if (type.type === "coproduct") {
		for (const [_, value] of forEntries(type.options)) {
			freezeType(value)
		}
		Object.freeze(type.options)
	}
	Object.freeze(type)
}
