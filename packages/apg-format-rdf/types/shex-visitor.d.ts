declare module "shex/packages/shex-visitor" {
	import {
		Schema,
		tripleExprObject,
		shapeExprObject,
	} from "shex/packages/shex-parser"

	export type Index = {
		tripleExprs: { [id: string]: tripleExprObject }
		shapeExprs: { [id: string]: shapeExprObject }
	}

	export default class Visitor {
		static index(schema: Schema): Index
	}
}
