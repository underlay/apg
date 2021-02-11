export function signalInvalidType(type) {
    console.error(type);
    throw new Error("Invalid type");
}
