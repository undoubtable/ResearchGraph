import { directions, edges, nodes, paperById, papers } from "../demo-data";

export interface EvidenceRef { kind: "paper" | "note" | "graph_relation" | "research_direction"; id: string; label: string; excerpt: string; }
export interface ToolResult<T> { data: T; evidence: EvidenceRef[]; }
export const researchTools = {
  search_papers(query: string): ToolResult<typeof papers> { const q = query.toLowerCase(); const data = papers.filter((p) => `${p.title} ${p.tags.join(" ")} ${p.mySummary}`.toLowerCase().includes(q)); return { data, evidence: data.map((p) => ({ kind: "paper", id: p.id, label: p.title, excerpt: p.mySummary ?? "" })) }; },
  get_paper(id: string) { const data = paperById(id); return { data, evidence: data ? [{ kind: "paper" as const, id, label: data.title, excerpt: data.mySummary ?? "" }] : [] }; },
  search_notes(query: string) { const q = query.toLowerCase(); const data = papers.filter((p) => `${p.myNotes} ${p.inspiration}`.toLowerCase().includes(q)).map((p) => ({ paperId: p.id, title: p.title, note: p.myNotes, inspiration: p.inspiration })); return { data, evidence: data.map((n) => ({ kind: "note" as const, id: n.paperId, label: `${n.title} · My Notes`, excerpt: n.note ?? n.inspiration ?? "" })) }; },
  search_methods(query: string) { return searchNodes("Method", query); },
  search_problems(query: string) { return searchNodes("Problem", query); },
  search_concepts(query: string) { return searchNodes("Concept", query); },
  search_research_directions(query: string) { const q = query.toLowerCase(); const data = directions.filter((d) => `${d.title} ${d.description} ${d.keywords.join(" ")}`.toLowerCase().includes(q)); return { data, evidence: data.map((d) => ({ kind: "research_direction" as const, id: d.id, label: d.title, excerpt: d.description })) }; },
  search_graph(query: string) { const q = query.toLowerCase(); const matchedNodes = nodes.filter((n) => `${n.label} ${n.type}`.toLowerCase().includes(q)); const ids = new Set(matchedNodes.map((n) => n.id)); const matchedEdges = edges.filter((e) => ids.has(e.source) || ids.has(e.target) || `${e.relationType} ${e.evidence}`.toLowerCase().includes(q)); return { data: { nodes: matchedNodes, edges: matchedEdges }, evidence: matchedEdges.map(edgeEvidence) }; },
  get_related_papers(id: string) { const paperNode = nodes.find((n) => n.paperId === id); const relatedIds = new Set(edges.filter((e) => paperNode && (e.source === paperNode.id || e.target === paperNode.id)).flatMap((e) => [e.source, e.target])); const data = papers.filter((p) => nodes.some((n) => n.paperId === p.id && relatedIds.has(n.id))); return { data, evidence: data.map((p) => ({ kind: "paper" as const, id: p.id, label: p.title, excerpt: p.mySummary ?? "" })) }; },
  compare_papers(ids: string[]) { const data = ids.map(paperById).filter(Boolean); return { data, evidence: data.map((p) => ({ kind: "paper" as const, id: p!.id, label: p!.title, excerpt: p!.mySummary ?? "" })) }; },
};
function searchNodes(type: "Method" | "Problem" | "Concept", query: string) { const q = query.toLowerCase(); const data = nodes.filter((n) => n.type === type && `${n.label} ${n.description}`.toLowerCase().includes(q)); return { data, evidence: data.map((n) => ({ kind: "graph_relation" as const, id: n.id, label: n.label, excerpt: n.description ?? `${type} node` })) }; }
function edgeEvidence(edge: (typeof edges)[number]): EvidenceRef { return { kind: "graph_relation", id: edge.id, label: edge.relationType, excerpt: edge.evidence }; }

export type ResearchToolName = keyof typeof researchTools;
