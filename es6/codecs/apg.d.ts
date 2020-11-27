import * as t from "io-ts";
import APG from "../apg.js";
export declare const reference: t.Type<APG.Reference>;
export declare const unit: t.Type<APG.Unit>;
export declare const uri: t.Type<APG.Uri>;
export declare const literal: t.Type<APG.Literal>;
export declare const product: t.Type<APG.Product>;
export declare const coproduct: t.Type<APG.Coproduct>;
export declare const type: t.Type<APG.Type>;
declare const codec: t.Type<APG.Schema>;
export default codec;
