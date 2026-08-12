import type { Paper } from "./types";

export interface PaperAnalysis {
  researchQuestion?: string;
  methodSummary?: string;
  dataSummary?: string;
  mainContributions?: string;
  mainResults?: string;
  limitations?: string;
  futureWork?: string;
}

type AnalysisField = keyof PaperAnalysis;

const patterns: Record<AnalysisField, RegExp[]> = {
  researchQuestion: [
    /\bwe (?:aim|seek|investigate|examine|study|explore|address)\b/i,
    /\b(?:objective|research question|challenge|problem)\b/i,
    /\b(?:how|whether) (?:can|to|does|do|is|are)\b/i,
    /(?:旨在|研究目标|研究问题|探索|能否|如何)/,
  ],
  methodSummary: [
    /\bwe (?:propose|develop|present|introduce|design|employ|use)\b/i,
    /\b(?:method|methodology|framework|model|approach|algorithm|architecture)\b/i,
    /(?:提出|构建|设计|采用|方法|模型|框架|算法)/,
  ],
  dataSummary: [
    /\b(?:dataset|data set|benchmark|corpus|database)\b/i,
    /\b(?:participants?|patients?|subjects?|samples?|images?|records?)\b/i,
    /(?:数据集|数据库|样本|受试者|患者|图像|语料库)/,
  ],
  mainContributions: [
    /\b(?:our |the )?contributions?\b/i,
    /\b(?:novel|first|new)\b/i,
    /\bwe (?:propose|introduce|present)\b/i,
    /(?:主要贡献|创新|首次|提出)/,
  ],
  mainResults: [
    /\b(?:results?|experiments?|evaluation) (?:show|shows|showed|demonstrate|demonstrates|indicate|indicates)\b/i,
    /\b(?:outperform|outperforms|achieve|achieves|improve|improves|increase|decrease)\b/i,
    /(?:结果表明|实验表明|优于|提升|降低|达到)/,
  ],
  limitations: [
    /\b(?:limitation|limitations|drawback|shortcoming|weakness)\b/i,
    /\b(?:however|nevertheless).*(?:limited|cannot|fail|lack)\b/i,
    /(?:局限|不足|然而.*(?:无法|缺乏|有限))/,
  ],
  futureWork: [
    /\b(?:future work|future research|further work|further research)\b/i,
    /\b(?:we plan|we intend|remains? to be|could be extended)\b/i,
    /(?:未来工作|未来研究|后续研究|有待进一步)/,
  ],
};

const fieldOrder: AnalysisField[] = [
  "researchQuestion",
  "methodSummary",
  "dataSummary",
  "mainContributions",
  "mainResults",
  "limitations",
  "futureWork",
];

function cleanText(value: string) {
  return value
    .replace(/-\s+([a-z])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function sentencesFrom(value: string) {
  return cleanText(value)
    .split(/(?<=[.!?。！？])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35 && sentence.length <= 520)
    .filter((sentence) => !/^(?:references|acknowledg|copyright|keywords?\b)/i.test(sentence));
}

function findSentence(sentences: string[], field: AnalysisField, used: Set<string>) {
  let best: { sentence: string; score: number } | undefined;
  for (const sentence of sentences) {
    let score = patterns[field].reduce((total, pattern) => total + (pattern.test(sentence) ? 1 : 0), 0);
    if (!score) continue;
    if (used.has(sentence)) score -= 0.15;
    if (field === "dataSummary" && /\b(?:dataset|data set|benchmark|corpus|database)\b/i.test(sentence)) score += 0.8;
    if (field === "limitations" && /\blimitations?\b/i.test(sentence)) score += 0.8;
    if (field === "futureWork" && /\bfuture (?:work|research)\b/i.test(sentence)) score += 0.8;
    if (!best || score > best.score) best = { sentence, score };
  }
  if (!best || best.score < 0.5) return undefined;
  used.add(best.sentence);
  return best.sentence;
}

export function analyzePaperText(text: string): PaperAnalysis {
  const sentences = sentencesFrom(text);
  const used = new Set<string>();
  return Object.fromEntries(
    fieldOrder
      .map((field) => [field, findSentence(sentences, field, used)] as const)
      .filter((entry): entry is readonly [AnalysisField, string] => Boolean(entry[1])),
  );
}

export function fillMissingPaperAnalysis(paper: Paper, analysis: PaperAnalysis): Partial<Paper> {
  return Object.fromEntries(
    fieldOrder
      .filter((field) => !paper[field] && analysis[field])
      .map((field) => [field, analysis[field]]),
  );
}

export async function extractPdfText(file: Blob, maxPages = 40) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(maxPages, document.numPages); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  return cleanText(pages.join(" "));
}
