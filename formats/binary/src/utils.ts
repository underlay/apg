export function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error("Invalid type")
}
