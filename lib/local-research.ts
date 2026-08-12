import { directions as demoDirections } from "./demo-data";
import type { ResearchDirection } from "./types";

const DIRECTIONS_KEY = "researchgraph.directions.v1";
const ACTIVE_DIRECTION_KEY = "researchgraph.active-direction.v1";

export function loadResearchDirections(): ResearchDirection[] {
  if (typeof window === "undefined") return demoDirections;
  try {
    const stored = window.localStorage.getItem(DIRECTIONS_KEY);
    if (!stored) {
      saveResearchDirections(demoDirections);
      return demoDirections;
    }
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed) || !parsed.length) return demoDirections;
    return (parsed as ResearchDirection[]).map((direction) => ({
      ...direction,
      relatedPaperIds: direction.relatedPaperIds ?? [],
    }));
  } catch {
    return demoDirections;
  }
}

export function saveResearchDirections(directions: ResearchDirection[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DIRECTIONS_KEY, JSON.stringify(directions));
  window.dispatchEvent(new CustomEvent("researchgraph:directions"));
}

export function loadActiveDirectionId(directions = loadResearchDirections()) {
  if (typeof window === "undefined") return directions[0]?.id;
  const stored = window.localStorage.getItem(ACTIVE_DIRECTION_KEY);
  return directions.some((direction) => direction.id === stored) ? stored! : directions[0]?.id;
}

export function saveActiveDirectionId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_DIRECTION_KEY, id);
  window.dispatchEvent(new CustomEvent("researchgraph:directions"));
}
