type R<K extends string, V extends any = any> = Readonly<Record<K, V>>

const keyMap = new WeakMap<R<string>, readonly string[]>()

export function* forEntries<K extends string, V extends any>(
	object: R<K, V>
): Generator<[K, V, number], void, undefined> {
	for (const [index, key] of getKeys(object).entries()) {
		yield [key, object[key], index]
	}
}

export function getKeys<K extends string>(object: R<K>): readonly K[] {
	if (keyMap.has(object)) {
		return keyMap.get(object)! as K[]
	} else {
		const keys = Object.keys(object).sort()
		Object.freeze(keys)
		keyMap.set(object, keys)
		return keys as K[]
	}
}

export function getKeyIndex<K extends string>(object: R<K>, key: K): number {
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

export function mapKeys<S extends { readonly [key in string]: any }, T>(
	object: S,
	map: <Key extends keyof S>(value: S[Key], key: Key) => T
): { readonly [key in keyof S]: T } {
	const keys = getKeys(object)
	const result = Object.fromEntries(
		keys.map((key) => [key, map(object[key], key)])
	)
	keyMap.set(result, keys as readonly string[])
	Object.freeze(result)
	return result as { readonly [key in keyof S]: T }
}

export function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error("Invalid type")
}

export type ZIterable<E> = E extends Iterable<any>[]
	? { [k in keyof E]: E[k] extends Iterable<infer T> ? T : E[k] }
	: never

export const zip = <E extends Iterable<any>[]>(
	...args: E
): Iterable<[...ZIterable<E>, number]> => ({
	[Symbol.iterator]() {
		const iterators = args.map((arg) => arg[Symbol.iterator]())
		let i = 0
		return {
			next() {
				const results = iterators.map((iter) => iter.next())
				if (results.some(({ done }) => done)) {
					return { done: true, value: undefined }
				} else {
					const values = results.map(({ value }) => value) as ZIterable<E>
					return { done: false, value: [...values, i++] }
				}
			},
		}
	},
})
