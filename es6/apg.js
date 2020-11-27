var APG;
(function (APG) {
    class Pointer {
        constructor(index) {
            this.index = index;
            Object.freeze(this);
        }
        get termType() {
            return "Pointer";
        }
    }
    APG.Pointer = Pointer;
    class Record extends Array {
        constructor(components, values) {
            super(...values);
            this.components = components;
            Object.freeze(this);
        }
        get termType() {
            return "Record";
        }
        get(key) {
            const index = this.components.indexOf(key);
            if (index in this) {
                return this[index];
            }
            else {
                throw new Error(`Index out of range: ${index}`);
            }
        }
        map(f) {
            const result = new Array(this.length);
            for (const [i, value] of this.entries()) {
                result[i] = f(value, i, this);
            }
            return result;
        }
    }
    APG.Record = Record;
    class Variant {
        constructor(option, value) {
            this.option = option;
            this.value = value;
            Object.freeze(this);
        }
        get termType() {
            return "Variant";
        }
    }
    APG.Variant = Variant;
})(APG || (APG = {}));
export default APG;
//# sourceMappingURL=apg.js.map