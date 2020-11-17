import { BlankNode } from "n3.ts";
import { v4 as uuid } from "uuid";
export function signalInvalidType(type) {
    console.error(type);
    throw new Error("Invalid type");
}
export const rootId = uuid();
export function getID() {
    let id = 0;
    return () => new BlankNode(`b${id++}`);
}
//# sourceMappingURL=utils.js.map