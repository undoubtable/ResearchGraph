import type { Paper } from "./types";

export function paperSourceUrl(paper: Pick<Paper, "doi" | "url">) {
  const doi = paper.doi
    ?.trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
  if (doi) return `https://doi.org/${doi}`;

  const rawUrl = paper.url?.trim();
  if (!rawUrl) return undefined;
  const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}
