export type ReadingStatus = "to_read" | "reading" | "read";
export type NodeType = "Paper" | "Method" | "Problem" | "Concept" | "Dataset" | "ResearchIdea";
export type RelationType = "USES" | "STUDIES" | "USES_CONCEPT" | "USES_DATASET" | "HAS_LIMITATION" | "SOLVES" | "EXTENDS" | "SUPPORTS" | "CONTRADICTS" | "RELATED_TO";
export type CreatedBy = "user" | "ai" | "import";

export interface Paper {
  id: string; title: string; authors: string[]; year?: number; venue?: string; doi?: string;
  abstract?: string; researchQuestion?: string; methodSummary?: string; dataSummary?: string;
  mainContributions?: string; mainResults?: string; limitations?: string; futureWork?: string;
  readingStatus: ReadingStatus; rating?: number; tags: string[]; mySummary?: string;
  myNotes?: string; inspiration?: string; updatedAt: string; isDemo?: boolean;
}
export interface GraphNode { id: string; type: NodeType; label: string; description?: string; paperId?: string; }
export interface GraphEdge { id: string; source: string; target: string; relationType: RelationType; confidence: number; evidence: string; createdBy: CreatedBy; createdAt: string; }
export interface ResearchDirection { id: string; title: string; description: string; keywords: string[]; notes: string; relatedPapers: string[]; relatedMethods: string[]; relatedProblems: string[]; relatedConcepts: string[]; }
