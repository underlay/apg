import { getKeys } from "@underlay/apg";
export const isUnit = (type) => type.type === "product" && getKeys(type.components).length === 0;
