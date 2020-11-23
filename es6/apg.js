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
        constructor(node, componentKeys, values) {
            super(...values);
            this.node = node;
            this.componentKeys = componentKeys;
            Object.freeze(this);
        }
        map(f) {
            const result = new Array(this.length);
            for (const [i, value] of this.entries()) {
                result[i] = f(value, i, this);
            }
            return result;
        }
        get termType() {
            return "Record";
        }
        get(key) {
            const index = this.componentKeys.indexOf(key);
            if (index === -1) {
                throw new Error(`Key not found: ${key}`);
            }
            else {
                return this[index];
            }
        }
    }
    APG.Record = Record;
    class Variant {
        constructor(node, key, value) {
            this.node = node;
            this.key = key;
            this.value = value;
            Object.freeze(this);
        }
        get termType() {
            return "Variant";
        }
    }
    APG.Variant = Variant;
    // export type Mapping = readonly [
    // 	readonly APG.Path[],
    // 	readonly (readonly APG.Expression[])[]
    // ]
})(APG || (APG = {}));
export default APG;
//# sourceMappingURL=apg.js.map