import { papers as demoPapers } from "./demo-data";
import type { Paper } from "./types";

const STORAGE_KEY = "researchgraph.papers.v1";

export function loadLocalPapers(): Paper[] {
  if (typeof window === "undefined") return demoPapers;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveLocalPapers(demoPapers);
    return demoPapers;
  }
  try {
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? (parsed as Paper[]) : demoPapers;
  } catch {
    return demoPapers;
  }
}

export function saveLocalPapers(papers: Paper[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
  window.dispatchEvent(new CustomEvent("researchgraph:papers"));
}

export function updateLocalPaper(id: string, update: Partial<Paper>) {
  const papers = loadLocalPapers().map((paper) =>
    paper.id === id
      ? { ...paper, ...update, updatedAt: new Date().toISOString().slice(0, 10) }
      : paper,
  );
  saveLocalPapers(papers);
  return papers.find((paper) => paper.id === id);
}

export function exportLibrary(papers: Paper[]) {
  const blob = new Blob([JSON.stringify({ version: 1, papers }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `researchgraph-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importLibrary(file: File): Promise<Paper[]> {
  const payload = JSON.parse(await file.text()) as { papers?: unknown } | unknown[];
  const papers = Array.isArray(payload)
    ? payload
    : (payload as { papers?: unknown }).papers;
  if (!Array.isArray(papers)) throw new Error("备份文件中没有有效的 papers 数组。 ");
  saveLocalPapers(papers as Paper[]);
  return papers as Paper[];
}
