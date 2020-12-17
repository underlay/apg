import { getKeys } from "../utils.js";
export const isUnit = (type) => type.type === "product" && getKeys(type.components).length === 0;
//# sourceMappingURL=unit.js.map