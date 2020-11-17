import zip from "ziterable";
import { isTypeAssignable, unify } from "./type.js";
import { signalInvalidType } from "./utils.js";
export const applyExpressions = (S, expressions, source) => expressions.reduce((type, expression) => apply(S, expression, type), source);
export function apply(S, expression, source) {
    if (expression.type === "identity") {
        return source;
    }
    else if (expression.type === "initial") {
        throw new Error("Not implemented");
    }
    else if (expression.type === "terminal") {
        return Object.freeze({ type: "unit" });
    }
    else if (expression.type === "identifier") {
        return Object.freeze({ type: "iri" });
    }
    else if (expression.type === "constant") {
        const { value } = expression.value.datatype;
        return Object.freeze({ type: "literal", datatype: value });
    }
    else if (expression.type === "dereference") {
        if (source.type === "reference" &&
            source.value in S &&
            S[source.value].key === expression.key) {
            return S[source.value].value;
        }
        else {
            throw new Error("Invalid dereference morphism");
        }
    }
    else if (expression.type === "projection") {
        if (source.type === "product") {
            const component = source.components.find(({ key }) => key === expression.key);
            if (component === undefined) {
                throw new Error("Invalid projection morphism");
            }
            else {
                return component.value;
            }
        }
        else {
            throw new Error("Invalid projection morphism");
        }
    }
    else if (expression.type === "injection") {
        return Object.freeze({
            type: "coproduct",
            options: Object.freeze([applyOption(S, source, expression)]),
        });
    }
    else if (expression.type === "tuple") {
        return Object.freeze({
            type: "product",
            components: Object.freeze(Array.from(applyComponents(S, source, expression))),
        });
    }
    else if (expression.type === "match") {
        if (source.type === "coproduct") {
            const cases = Array.from(applyCases(S, source, expression));
            if (cases.length === 0) {
                throw new Error("Empty case analysis");
            }
            else {
                return cases.reduce(unify);
            }
        }
        else {
            throw new Error("Invalid match morphism");
        }
        // } else if (expression.type === "composition") {
        // 	const [a, b] = expression.morphisms
        // 	return apply(S, b, apply(S, a, source))
    }
    else {
        signalInvalidType(expression);
    }
}
function applyOption(S, source, { value, key }) {
    return Object.freeze({
        type: "option",
        key,
        value: value.reduce((type, expression) => apply(S, expression, type), source),
    });
}
function* applyComponents(S, source, { slots }) {
    for (const { key, value } of slots) {
        yield Object.freeze({
            type: "component",
            key,
            value: applyExpressions(S, value, source),
        });
    }
}
function* applyCases(S, source, { cases }) {
    for (const [option, { key, value }] of zip(source.options, cases)) {
        if (option.key !== key) {
            throw new Error("Invalid case analysis");
        }
        yield applyExpressions(S, value, source);
    }
}
export function validateExpressions(S, expressions, source, target) {
    let type;
    try {
        type = applyExpressions(S, expressions, source);
    }
    catch (e) {
        return false;
    }
    return isTypeAssignable(type, target);
}
// export function validateMorphism(
// 	S: APG.Schema,
// 	expression: APG.Expression,
// 	source: APG.Type,
// 	target: APG.Type
// ): boolean {
// 	if (expression.type === "identity") {
// 		return isTypeAssignable(source, target)
// 	} else if (expression.type === "initial") {
// 		throw new Error("Not implemented")
// 	} else if (expression.type === "terminal") {
// 		return target.type === "unit"
// 	} else if (expression.type === "identifier") {
// 		return target.type === "iri"
// 	} else if (expression.type === "constant") {
// 		return (
// 			target.type === "literal" &&
// 			target.datatype === expression.value.datatype.value
// 		)
// 	} else if (expression.type === "dereference") {
// 		return (
// 			source.type === "reference" &&
// 			source.value in S &&
// 			S[source.value].key === expression.key &&
// 			isTypeAssignable(S[source.value].value, target)
// 		)
// 	} else if (expression.type === "projection") {
// 		if (source.type !== "product") {
// 			return false
// 		}
// 		const component = source.components.find(
// 			({ key }) => key === expression.key
// 		)
// 		return component !== undefined && isTypeAssignable(component.value, target)
// 	} else if (expression.type === "injection") {
// 		if (target.type !== "coproduct") {
// 			return false
// 		}
// 		const option = target.options.find(({ key }) => key === expression.key)
// 		return (
// 			option !== undefined &&
// 			isTypeAssignable(
// 				applyExpressions(S, expression.value, source),
// 				option.value
// 			)
// 		)
// 	} else if (expression.type === "tuple") {
// 		if (target.type !== "product") {
// 			return false
// 		}
// 		for (const { key, value } of target.components) {
// 			const s = expression.slots.find((s) => s.key === key)
// 			if (s !== undefined) {
// 				let type: APG.Type
// 				try {
// 					type = s.value.reduce(
// 						(type: APG.Type, expression: APG.Expression) =>
// 							apply(S, expression, type),
// 						source
// 					)
// 				} catch (e) {
// 					return false
// 				}
// 				if (isTypeAssignable(type, value)) {
// 					continue
// 				} else {
// 					return false
// 				}
// 			} else {
// 				return false
// 			}
// 		}
// 		return true
// 	} else if (expression.type === "match") {
// 		if (source.type !== "coproduct") {
// 			return false
// 		}
// 		for (const { key, value } of source.options) {
// 			const c = expression.cases.find((c) => c.key === key)
// 			if (c !== undefined) {
// 				let type: APG.Type
// 				try {
// 					type = c.value.reduce(
// 						(type: APG.Type, expression: APG.Expression) =>
// 							apply(S, expression, type),
// 						target
// 					)
// 				} catch (e) {
// 					return false
// 				}
// 				if (isTypeAssignable(source, type)) {
// 					continue
// 				} else {
// 					return false
// 				}
// 			} else {
// 				return false
// 			}
// 		}
// 		return true
// 	} else {
// 		signalInvalidType(expression)
// 	}
// }
//# sourceMappingURL=morphism.js.map