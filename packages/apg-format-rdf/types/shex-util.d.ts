declare module "shex/packages/shex-util" {
	import RDF from "rdf-js"
	import { Schema } from "shex/packages/shex-parser"
	interface DB {
		getQuads(
			subject: RDF.Term | string | null,
			predicate: RDF.Term | string | null,
			object: RDF.Term | string | null,
			graph: RDF.Term | string | null
		): RDF.Quad[]
		getSubjects(
			predicate: RDF.Term | string | null,
			object: RDF.Term | string | null,
			graph: RDF.Term | string | null
		): RDF.Quad_Subject[]
		getPredicates(
			subject: RDF.Term | string | null,
			object: RDF.Term | string | null,
			graph: RDF.Term | string | null
		): RDF.Quad_Predicate[]
		getObjects(
			subject: RDF.Term | string | null,
			predicate: RDF.Term | string | null,
			graph: RDF.Term | string | null
		): RDF.Quad_Object[]
		getGraphs(
			subject: RDF.Term | string | null,
			predicate: RDF.Term | string | null,
			object: RDF.Term | string | null
		): RDF.Quad_Graph[]
		size: number
	}

	export interface RdfJsDB extends DB {}

	export function rdfjsDB(store: DB): RdfJsDB
	export function emptySchema(): { type: "Schema" }
	export function merge(
		left: Schema,
		right: Schema,
		overwrite: boolean,
		inPlace: boolean
	): void
}
