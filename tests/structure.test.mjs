import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root=new URL("../",import.meta.url);
test("data model distinguishes semantic node and provenance types",async()=>{const [types,schema]=await Promise.all([readFile(new URL("lib/types.ts",root),"utf8"),readFile(new URL("db/schema.ts",root),"utf8")]);for(const type of ["Paper","Method","Problem","Concept","Dataset","ResearchIdea"])assert.match(types,new RegExp(`\\"${type}\\"`));for(const field of ["confidence","evidence","createdBy"])assert.match(schema,new RegExp(field));});
test("agent exposes the complete phase-one tool contract",async()=>{const source=await readFile(new URL("lib/agent/tools.ts",root),"utf8");for(const tool of ["search_papers","get_paper","search_notes","search_methods","search_problems","search_concepts","search_research_directions","search_graph","get_related_papers","compare_papers"])assert.match(source,new RegExp(`${tool}\\(`));});
test("starter preview is removed and product metadata is present",async()=>{const [layout,page,pkg]=await Promise.all([readFile(new URL("app/layout.tsx",root),"utf8"),readFile(new URL("app/page.tsx",root),"utf8"),readFile(new URL("package.json",root),"utf8")]);assert.match(layout,/ResearchGraph/);assert.doesNotMatch(page,/SkeletonPreview|codex-preview/);assert.doesNotMatch(pkg,/react-loading-skeleton/);});
