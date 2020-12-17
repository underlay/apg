import { v4 as uuid } from "uuid"

type R<K extends string = string, V = any> = Readonly<Record<K, V>>

const keyMap = new WeakMap<R, readonly string[]>()

export function* forEntries<K extends string = string, V = any>(
	object: R<K, V>
): Generator<[K, V, number], void, undefined> {
	for (const [index, key] of getKeys(object).entries()) {
		yield [key, object[key], index]
	}
}

export function getKeys<T extends R = R>(object: T): readonly (keyof T)[] {
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

export function mapKeys<T, K extends string = string, V = any>(
	object: R<K, V>,
	map: <Key extends K>(value: R[Key], key: Key) => T
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
