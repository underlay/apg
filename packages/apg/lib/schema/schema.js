import { getKeys } from "../utils.js";
export const schema = (labels) => Object.freeze(labels);
export const reference = (value) => Object.freeze({ kind: "reference", value });
export const isReference = (type) => type.kind === "reference";
export const uri = () => Object.freeze({ kind: "uri" });
export const isUri = (type) => type.kind === "uri";
export const literal = (datatype) => Object.freeze({ kind: "literal", datatype });
export const isLiteral = (type) => type.kind === "literal";
export const product = (components) => Object.freeze({ kind: "product", components: Object.freeze(components) });
export const isProduct = (type) => type.kind === "product";
export const unit = () => product({});
export const isUnit = (type) => type.kind === "product" && getKeys(type.components).length === 0;
export const coproduct = (options) => Object.freeze({ kind: "coproduct", options: Object.freeze(options) });
export const isCoproduct = (type) => type.kind === "coproduct";
