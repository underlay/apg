import { v4 as uuid } from "uuid"

export function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error("Invalid type")
}

export const rootId = uuid()

let id = 0
export function getId() {
	return `${rootId}-${id++}`
}
