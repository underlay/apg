import APG from "./apg.js";
declare const caseLabel: APG.Label;
declare const elementLabel: APG.Label;
declare const expressionLabel: APG.Label;
declare const matchLabel: APG.Label;
declare const pathLabel: APG.Label;
declare const tupleLabel: APG.Label;
declare const expressionSchema: readonly [
    typeof caseLabel,
    typeof elementLabel,
    typeof expressionLabel,
    typeof matchLabel,
    typeof pathLabel,
    typeof tupleLabel
];
export default expressionSchema;
