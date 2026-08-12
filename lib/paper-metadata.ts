export interface PaperMetadataCandidate {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  abstract?: string;
  summary?: string;
  keywords?: string[];
  score?: number;
}

interface OpenAlexWork {
  doi?: string;
  primary_location?: { landing_page_url?: string; pdf_url?: string };
  best_oa_location?: { landing_page_url?: string; pdf_url?: string };
  locations?: Array<{ landing_page_url?: string; pdf_url?: string }>;
  abstract_inverted_index?: Record<string, number[]>;
  topics?: Array<{ display_name?: string; score?: number }>;
}

interface CrossrefItem {
  DOI?: string;
  URL?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  published?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  abstract?: string;
  score?: number;
}

function plainText(value?: string) {
  if (!value) return "";
  const document = new DOMParser().parseFromString(value, "text/html");
  return (document.body.textContent || "").replace(/\s+/g, " ").trim();
}

function restoreAbstract(index?: Record<string, number[]>) {
  if (!index) return "";
  const words: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words.push([position, word]);
  }
  return words.sort((left, right) => left[0] - right[0]).map((item) => item[1]).join(" ");
}

function oneSentence(abstract: string) {
  if (!abstract) return "";
  const first = abstract.match(/^.{40,320}?(?:[.!?。！？](?=\s|$)|$)/u)?.[0] || abstract.slice(0, 260);
  return first.trim();
}

async function fromCrossref(item: CrossrefItem): Promise<PaperMetadataCandidate> {
  const dateParts = item.published?.["date-parts"] ?? item.issued?.["date-parts"];
  const candidate: PaperMetadataCandidate = {
    id: item.DOI || item.URL || item.title?.[0] || crypto.randomUUID(),
    title: item.title?.[0] || "未命名论文",
    authors: (item.author ?? []).map((author) =>
      author.name || [author.given, author.family].filter(Boolean).join(" "),
    ).filter(Boolean),
    year: dateParts?.[0]?.[0],
    venue: item["container-title"]?.[0],
    doi: item.DOI,
    url: item.URL,
    abstract: plainText(item.abstract),
    score: item.score,
  };
  if (!item.DOI) return candidate;
  try {
    const response = await fetch(`https://api.openalex.org/works?filter=doi:${encodeURIComponent(item.DOI)}&per-page=1`, { headers: { Accept: "application/json" } });
    if (!response.ok) return candidate;
    const payload = await response.json() as { results?: OpenAlexWork[] };
    const work = payload.results?.[0];
    const pdfLocation = work?.best_oa_location?.pdf_url
      ? work.best_oa_location
      : work?.locations?.find((location) => location.pdf_url);
    const abstract = restoreAbstract(work?.abstract_inverted_index) || candidate.abstract || "";
    const keywords = (work?.topics ?? [])
      .filter((topic) => (topic.score ?? 0) >= 0.35)
      .slice(0, 6)
      .map((topic) => topic.display_name)
      .filter((value): value is string => Boolean(value));
    return {
      ...candidate,
      url: work?.primary_location?.landing_page_url || candidate.url,
      pdfUrl: pdfLocation?.pdf_url,
      abstract,
      summary: oneSentence(abstract),
      keywords,
    };
  } catch {
    return candidate;
  }
}

export async function searchPaperMetadata(query: string) {
  const normalizedDoi = query
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
  const isDoi = /^10\.\d{4,9}\//i.test(normalizedDoi);
  const endpoint = isDoi
    ? `https://api.crossref.org/works/${encodeURIComponent(normalizedDoi)}`
    : `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=5&select=DOI,title,author,published,issued,container-title,URL,abstract,score`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("公开学术数据库暂时无法访问。 ");
  const payload = await response.json() as { message?: CrossrefItem | { items?: CrossrefItem[] } };
  if (isDoi) return payload.message ? [await fromCrossref(payload.message as CrossrefItem)] : [];
  const items = (payload.message as { items?: CrossrefItem[] })?.items ?? [];
  return Promise.all(items.map(fromCrossref));
}

function normalizedTitle(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function titleSimilarity(left: string, right: string) {
  const a = normalizedTitle(left);
  const b = normalizedTitle(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  const containment = intersection / Math.max(1, Math.min(aTokens.size, bTokens.size));
  const jaccard = intersection / Math.max(1, union);
  return containment * 0.65 + jaccard * 0.35;
}

export function chooseMetadataMatch(query: string, candidates: PaperMetadataCandidate[]) {
  if (!candidates.length) return { selected: undefined, ambiguous: [] as PaperMetadataCandidate[] };
  const normalizedDoi = query
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
  if (/^10\.\d{4,9}\//i.test(normalizedDoi)) {
    return { selected: candidates[0], ambiguous: [] as PaperMetadataCandidate[] };
  }
  const ranked = candidates
    .map((candidate) => ({ candidate, similarity: titleSimilarity(query, candidate.title) }))
    .sort((left, right) => right.similarity - left.similarity);
  const best = ranked[0];
  const runnerUp = ranked[1];
  const decisive = best.similarity >= 0.78
    && (!runnerUp || best.similarity - runnerUp.similarity >= 0.12);
  return decisive
    ? { selected: best.candidate, ambiguous: [] as PaperMetadataCandidate[] }
    : { selected: undefined, ambiguous: ranked.filter((item) => item.similarity >= 0.45).slice(0, 3).map((item) => item.candidate) };
}

export async function extractPdfSearchText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= Math.min(2, document.numPages); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  const text = pages.join(" ").replace(/\s+/g, " ").trim();
  const doi = text.match(/10\.\d{4,9}\/[\w.()/:;-]+/i)?.[0]?.replace(/[.,;)]$/, "");
  if (doi) return doi;
  return file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
}
