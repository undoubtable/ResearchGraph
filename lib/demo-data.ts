import type { GraphEdge, GraphNode, Paper, ResearchDirection } from "./types";

export const papers: Paper[] = [
  { id: "cbm", title: "Concept Bottleneck Models", authors: ["Pang Wei Koh", "Thao Nguyen", "Yew Siang Tang", "Stephen Mussmann", "Emma Pierson", "Been Kim", "Percy Liang"], year: 2020, venue: "ICML", readingStatus: "read", rating: 5, tags: ["Concept Learning", "Interpretability"], mySummary: "在预测任务中显式学习可供人理解和干预的概念瓶颈。", researchQuestion: "如何在保持预测能力的同时，让模型通过人类可理解概念进行推理？", methodSummary: "先预测概念，再从概念预测最终标签；支持对概念进行人工干预。", dataSummary: "以论文公开实验设置为准；此演示不扩写未核实数据细节。", mainContributions: "提出可干预的概念瓶颈建模范式。", mainResults: "演示数据：具体指标请回查原文。", limitations: "概念标注成本高，且概念集合可能不完整。", futureWork: "弱监督概念学习与不完整概念空间。", myNotes: "概念层能成为知识图谱与预测模型之间的接口。", inspiration: "将海洋涡旋物理概念作为可干预的中间变量。", updatedAt: "2026-08-10", isDemo: true },
  { id: "nscr", title: "Interpretable Neural-Symbolic Concept Reasoning", authors: ["Demo authors — verify before citation"], year: 2023, venue: "Demo record", readingStatus: "reading", tags: ["Neuro-symbolic", "Reasoning"], mySummary: "用概念层连接感知模型与符号推理。", researchQuestion: "如何让神经模型的中间概念参与可解释组合推理？", methodSummary: "演示占位：神经概念表示与结构化推理模块。", limitations: "演示记录，元数据与结论尚待文献核验。", myNotes: "关注推理链是否可验证，而不只是可视化。", updatedAt: "2026-08-09", isDemo: true },
  { id: "neurrl", title: "NeurRL", authors: ["Demo authors — verify before citation"], year: 2024, venue: "Demo record", readingStatus: "to_read", tags: ["Neuro-symbolic", "Rule Learning"], mySummary: "待阅读：神经与规则学习结合的候选工作。", limitations: "仅为功能演示记录，不应作为可靠书目信息引用。", updatedAt: "2026-08-06", isDemo: true },
  { id: "oceancbm", title: "OceanCBM", authors: ["Personal research concept"], year: 2026, venue: "Research idea", readingStatus: "reading", tags: ["Ocean Eddy", "Concept Bottleneck"], mySummary: "面向可解释海洋涡旋识别的概念瓶颈研究构想。", researchQuestion: "物理概念约束能否提升海洋涡旋识别的可解释性与稳健性？", methodSummary: "个人研究构想：融合遥感表征、物理概念瓶颈和神经符号推理。", dataSummary: "计划评估多源海表高度、温度与流场数据；尚未确定数据集。", limitations: "当前是研究构想，不是已发表论文。", myNotes: "优先定义可观测、可干预、跨数据集稳定的海洋概念。", inspiration: "用证据图追踪每个研究假设的文献支持与冲突。", updatedAt: "2026-08-11", isDemo: true },
];

export const nodes: GraphNode[] = [
  { id: "p-cbm", type: "Paper", label: "Concept Bottleneck Models", paperId: "cbm" },
  { id: "p-nscr", type: "Paper", label: "Neural-Symbolic Concept Reasoning", paperId: "nscr" },
  { id: "m-cbm", type: "Method", label: "Concept bottleneck" },
  { id: "m-ns", type: "Method", label: "Neural-symbolic reasoning" },
  { id: "pr-explain", type: "Problem", label: "Explainable prediction" },
  { id: "pr-eddy", type: "Problem", label: "Ocean eddy recognition" },
  { id: "c-concept", type: "Concept", label: "Human-interpretable concept" },
  { id: "c-physics", type: "Concept", label: "Physical consistency" },
  { id: "d-ocean", type: "Dataset", label: "Multi-source ocean observations" },
  { id: "i-ocean", type: "ResearchIdea", label: "OceanCBM", description: "Neuro-symbolic reasoning for explainable ocean eddy recognition" },
];
export const edges: GraphEdge[] = [
  { id: "e1", source: "p-cbm", target: "m-cbm", relationType: "USES", confidence: 1, evidence: "Paper method section: concept bottleneck architecture.", createdBy: "import", createdAt: "2026-08-03" },
  { id: "e2", source: "p-cbm", target: "pr-explain", relationType: "STUDIES", confidence: .96, evidence: "Research question and introduction.", createdBy: "user", createdAt: "2026-08-04" },
  { id: "e3", source: "m-cbm", target: "pr-explain", relationType: "SOLVES", confidence: .82, evidence: "My note: explicit concepts make intervention possible.", createdBy: "user", createdAt: "2026-08-08" },
  { id: "e4", source: "p-nscr", target: "m-ns", relationType: "USES", confidence: .62, evidence: "Demo relation; confirm from source before use.", createdBy: "ai", createdAt: "2026-08-09" },
  { id: "e5", source: "i-ocean", target: "pr-eddy", relationType: "STUDIES", confidence: 1, evidence: "Research direction definition.", createdBy: "user", createdAt: "2026-08-10" },
  { id: "e6", source: "i-ocean", target: "m-cbm", relationType: "USES", confidence: .9, evidence: "Research plan note.", createdBy: "user", createdAt: "2026-08-10" },
  { id: "e7", source: "i-ocean", target: "d-ocean", relationType: "USES_DATASET", confidence: .7, evidence: "Candidate data source; not finalized.", createdBy: "user", createdAt: "2026-08-11" },
  { id: "e8", source: "p-cbm", target: "i-ocean", relationType: "SUPPORTS", confidence: .8, evidence: "Intervention mechanism supports the proposed concept interface.", createdBy: "user", createdAt: "2026-08-11" },
];
export const directions: ResearchDirection[] = [{ id: "ocean-ns", title: "Neuro-symbolic reasoning for explainable ocean eddy recognition", description: "探索如何把物理可解释概念、神经表征与结构化推理结合，用于更可信的海洋涡旋识别。", keywords: ["ocean eddy", "concept bottleneck", "neuro-symbolic", "explainability"], notes: "先建立概念词表与证据标准，再选择模型。所有 gap 必须能回溯到文献、笔记或图关系。", relatedPapers: ["Concept Bottleneck Models", "Interpretable Neural-Symbolic Concept Reasoning"], relatedMethods: ["Concept bottleneck", "Neural-symbolic reasoning"], relatedProblems: ["Explainable prediction", "Ocean eddy recognition"], relatedConcepts: ["Human-interpretable concept", "Physical consistency"] }];

export function paperById(id: string) { return papers.find((paper) => paper.id === id); }
