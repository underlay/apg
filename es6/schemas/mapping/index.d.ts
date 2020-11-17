import APG from "../apg.js";
declare const caseLabel: APG.Label;
declare const expressionLabel: APG.Label;
declare const mapLabel: APG.Label;
declare const matchLabel: APG.Label;
declare const pathLabel: APG.Label;
declare const slotLabel: APG.Label;
declare const tupleLabel: APG.Label;
declare const mappingSchema: readonly [
    typeof caseLabel,
    typeof expressionLabel,
    typeof mapLabel,
    typeof matchLabel,
    typeof pathLabel,
    typeof slotLabel,
    typeof tupleLabel
];
export default mappingSchema;
