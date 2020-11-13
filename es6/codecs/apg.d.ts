import * as t from "io-ts";
import APG from "../apg.js";
export declare const reference: t.Type<APG.Reference>;
export declare const unit: t.Type<APG.Unit>;
export declare const iri: t.Type<APG.Iri>;
export declare const literal: t.Type<APG.Literal>;
export declare const product: t.Type<APG.Product>;
export declare const coproduct: t.Type<APG.Coproduct>;
export declare const type: t.Type<APG.Type>;
export declare const component: t.Type<APG.Component>;
export declare const option: t.Type<APG.Option>;
export declare const label: t.TypeC<{
    type: t.LiteralC<"label">;
    key: t.StringC;
    value: t.Type<APG.Type, APG.Type, unknown>;
}>;
declare const codec: t.Type<APG.Schema>;
export default codec;
