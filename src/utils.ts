import { BlankNode } from "n3.ts"
import { v4 as uuid } from "uuid"

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
