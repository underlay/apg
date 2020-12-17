import { getKeys } from "./utils.js";
export default function diff(a, b) {
    for (const key in getKeys(a)) {
        if (key in b) {
            diffTypes(a[key], b[key]);
        }
    }
    return null;
}
function diffTypes(a, b) {
    // if (b.type === "unit") {
    // 	return [{ type: "terminal" }]
    // } else if (b.type === "uri") {
    // 	// if (a.type === )
    // }
    return null;
}
//# sourceMappingURL=delta.js.map