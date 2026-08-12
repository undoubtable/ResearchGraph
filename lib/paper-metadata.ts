export interface PaperMetadataCandidate {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  url?: string;
  score?: number;
}

interface CrossrefItem {
  DOI?: string;
  URL?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  published?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  score?: number;
}

function fromCrossref(item: CrossrefItem): PaperMetadataCandidate {
  const dateParts = item.published?.["date-parts"] ?? item.issued?.["date-parts"];
  return {
    id: item.DOI || item.URL || item.title?.[0] || crypto.randomUUID(),
    title: item.title?.[0] || "未命名论文",
    authors: (item.author ?? []).map((author) =>
      author.name || [author.given, author.family].filter(Boolean).join(" "),
    ).filter(Boolean),
    year: dateParts?.[0]?.[0],
    venue: item["container-title"]?.[0],
    doi: item.DOI,
    url: item.URL,
    score: item.score,
  };
}

export async function searchPaperMetadata(query: string) {
  const normalizedDoi = query
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
  const isDoi = /^10\.\d{4,9}\//i.test(normalizedDoi);
  const endpoint = isDoi
    ? `https://api.crossref.org/works/${encodeURIComponent(normalizedDoi)}`
    : `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=5&select=DOI,title,author,published,issued,container-title,URL,score`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("公开学术数据库暂时无法访问。 ");
  const payload = await response.json() as { message?: CrossrefItem | { items?: CrossrefItem[] } };
  if (isDoi) return payload.message ? [fromCrossref(payload.message as CrossrefItem)] : [];
  const items = (payload.message as { items?: CrossrefItem[] })?.items ?? [];
  return items.map(fromCrossref);
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
