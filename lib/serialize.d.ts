import APG from "./apg.js";
import * as N3 from "n3.ts";
export declare function serialize(instance: APG.Instance, schema: APG.Schema): Generator<N3.Quad, void, undefined>;
