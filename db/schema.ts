import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const papers = sqliteTable("papers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authors: text("authors").notNull().default("[]"),
  year: integer("year"), venue: text("venue"), doi: text("doi"), arxivId: text("arxiv_id"),
  url: text("url"), pdfPath: text("pdf_path"), abstract: text("abstract"),
  researchQuestion: text("research_question"), methodSummary: text("method_summary"),
  dataSummary: text("data_summary"), mainContributions: text("main_contributions"),
  mainResults: text("main_results"), limitations: text("limitations"), futureWork: text("future_work"),
  readingStatus: text("reading_status").notNull().default("to_read"), rating: integer("rating"),
  mySummary: text("my_summary"), inspiration: text("inspiration"), isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tags = sqliteTable("tags", { id: text("id").primaryKey(), name: text("name").notNull().unique(), color: text("color") });
export const paperTags = sqliteTable("paper_tags", { paperId: text("paper_id").notNull().references(() => papers.id, { onDelete: "cascade" }), tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }) }, (table) => [primaryKey({ columns: [table.paperId, table.tagId] })]);
export const notes = sqliteTable("notes", { id: text("id").primaryKey(), paperId: text("paper_id").references(() => papers.id, { onDelete: "cascade" }), title: text("title").notNull(), content: text("content").notNull().default(""), kind: text("kind").notNull().default("note"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`) });
export const graphNodes = sqliteTable("graph_nodes", { id: text("id").primaryKey(), type: text("type").notNull(), label: text("label").notNull(), description: text("description"), paperId: text("paper_id").references(() => papers.id, { onDelete: "cascade" }), createdBy: text("created_by").notNull().default("user"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`) });
export const graphEdges = sqliteTable("graph_edges", { id: text("id").primaryKey(), sourceId: text("source_id").notNull().references(() => graphNodes.id, { onDelete: "cascade" }), targetId: text("target_id").notNull().references(() => graphNodes.id, { onDelete: "cascade" }), relationType: text("relation_type").notNull(), confidence: real("confidence").notNull().default(1), evidence: text("evidence").notNull(), createdBy: text("created_by").notNull().default("user"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`) });
export const researchDirections = sqliteTable("research_directions", { id: text("id").primaryKey(), title: text("title").notNull(), description: text("description").notNull().default(""), keywords: text("keywords").notNull().default("[]"), notes: text("notes").notNull().default(""), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`) });

export type PaperRecord = typeof papers.$inferSelect;
export type GraphNodeRecord = typeof graphNodes.$inferSelect;
export type GraphEdgeRecord = typeof graphEdges.$inferSelect;
