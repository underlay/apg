export const iriHasPattern = (expression) => expression.hasOwnProperty("pattern");
export const literalHasPattern = (expression) => expression.hasOwnProperty("pattern");
export const context = {
    id: "@id",
    type: "@type",
    "@vocab": "http://underlay.org/ns/",
    key: { "@type": "@id" },
    value: { "@type": "@id" },
    datatype: { "@type": "@id" },
    options: {
        "@reverse": "source",
    },
    components: {
        "@reverse": "source",
    },
};
//# sourceMappingURL=apg.js.map