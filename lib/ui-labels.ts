import type { CreatedBy, RelationType } from "./types";

export const relationTypeLabel: Record<RelationType, string> = {
  USES: "使用",
  STUDIES: "研究",
  USES_CONCEPT: "使用概念",
  USES_DATASET: "使用数据集",
  HAS_LIMITATION: "存在局限",
  SOLVES: "解决",
  EXTENDS: "扩展",
  SUPPORTS: "支持",
  CONTRADICTS: "冲突",
  RELATED_TO: "相关",
};

export const createdByLabel: Record<CreatedBy, string> = {
  user: "用户",
  ai: "AI",
  import: "导入",
};

export const evidenceKindLabel: Record<string, string> = {
  paper: "论文",
  note: "笔记",
  graph_relation: "图谱关系",
  research_direction: "研究方向",
};
