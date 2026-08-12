import { analyzePaperText } from "./paper-analysis";

const academicTerms: Record<string, string> = {
  "artificial intelligence": "人工智能",
  "machine learning": "机器学习",
  "deep learning": "深度学习",
  "neural network": "神经网络",
  "computer vision": "计算机视觉",
  "natural language processing": "自然语言处理",
  "concept learning": "概念学习",
  "concept bottleneck": "概念瓶颈",
  "concept bottleneck model": "概念瓶颈模型",
  "interpretability": "可解释性",
  "explainability": "可解释性",
  "neuro-symbolic": "神经符号",
  "neural-symbolic": "神经符号",
  "reasoning": "推理",
  "rule learning": "规则学习",
  "remote sensing": "遥感",
  "ocean eddy": "海洋涡旋",
  "image classification": "图像分类",
  "object detection": "目标检测",
  "semantic segmentation": "语义分割",
  "representation learning": "表征学习",
  "self-supervised learning": "自监督学习",
  "weak supervision": "弱监督",
  "knowledge graph": "知识图谱",
  "large language model": "大语言模型",
};

function containsChinese(value: string) {
  return /[\u3400-\u9fff]/u.test(value);
}

function firstSentence(value: string) {
  return value.replace(/\s+/g, " ").trim().match(/^.{25,420}?(?:[.!?。！？](?=\s|$)|$)/u)?.[0]?.trim() || "";
}

async function translateMany(values: string[], target: "zh-CN" | "en") {
  if (!values.length) return [];
  const response = await fetch("/api/localize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: values, target }),
  });
  if (!response.ok) throw new Error("翻译服务暂时不可用");
  const payload = await response.json() as { translations?: string[] };
  return payload.translations ?? [];
}

async function translate(value: string, target: "zh-CN" | "en") {
  return (await translateMany([value.trim()], target))[0] || "";
}

function cleanChineseSummary(value: string) {
  let summary = value
    .replace(/^在本文中[，,]?\s*/u, "")
    .replace(/^(?:本文|我们|本研究|该研究)/u, "论文")
    .replace(/\s+/g, " ")
    .trim();
  if (!/^(?:论文|研究)/u.test(summary)) summary = `论文${summary}`;
  if (summary.length > 180) summary = `${summary.slice(0, 178).replace(/[，,；;：:\s]+$/u, "")}…`;
  return summary;
}

export async function bilingualizeKeywords(keywords: string[]) {
  const unique = [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))].slice(0, 6);
  const result = unique.map((keyword) => {
    if (keyword.includes(" / ")) return keyword;
    const knownChinese = academicTerms[keyword.toLowerCase()];
    return knownChinese ? `${knownChinese} / ${keyword}` : keyword;
  });
  const chineseIndexes = unique.map((keyword, index) => containsChinese(keyword) && !keyword.includes(" / ") ? index : -1).filter((index) => index >= 0);
  const englishIndexes = unique.map((keyword, index) => !containsChinese(keyword) && !result[index].includes(" / ") ? index : -1).filter((index) => index >= 0);
  try {
    const [englishTranslations, chineseTranslations] = await Promise.all([
      translateMany(chineseIndexes.map((index) => unique[index]), "en"),
      translateMany(englishIndexes.map((index) => unique[index]), "zh-CN"),
    ]);
    chineseIndexes.forEach((index, position) => {
      if (englishTranslations[position]) result[index] = `${unique[index]} / ${englishTranslations[position]}`;
    });
    englishIndexes.forEach((index, position) => {
      if (chineseTranslations[position]) result[index] = `${chineseTranslations[position]} / ${unique[index]}`;
    });
  } catch {
    return unique;
  }
  return result;
}

export async function summarizePaperInChinese(text: string) {
  if (!text.trim()) return "";
  const analysis = analyzePaperText(text);
  const primary = analysis.mainContributions || analysis.methodSummary || analysis.researchQuestion || firstSentence(text);
  const result = analysis.mainResults && analysis.mainResults !== primary ? analysis.mainResults : "";
  const source = [primary, result].filter(Boolean).join(" ");
  if (!source) return "";
  try {
    return cleanChineseSummary(containsChinese(source) ? source : await translate(source, "zh-CN"));
  } catch {
    return "";
  }
}
