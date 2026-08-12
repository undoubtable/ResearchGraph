# Data Model

## 主要实体

- `papers`：书目信息、科研结构、阅读状态与个人总结。
- `tags` / `paper_tags`：可复用标签，多对多关联。
- `notes`：既可挂到论文，也可作为独立笔记；`kind` 区分 note、summary、inspiration。
- `graph_nodes`：Paper、Method、Problem、Concept、Dataset、ResearchIdea。
- `graph_edges`：source、target、relation_type、confidence、evidence、created_by。
- `research_directions`：title、description、keywords、notes；关联实体通过图谱表达。

## 关系类型

`USES`、`STUDIES`、`USES_CONCEPT`、`USES_DATASET`、`HAS_LIMITATION`、`SOLVES`、`EXTENDS`、`SUPPORTS`、`CONTRADICTS`、`RELATED_TO`。

## Provenance

`created_by` 必须为 `user`、`ai` 或 `import`。AI 建立的边不等价于人工确认边；UI 同时展示来源与 confidence。`evidence` 非空，使边成为可审计主张，而不是装饰线。

## 存储约定

SQLite 中 authors、keywords 等低频数组第一阶段使用 JSON text；核心查询维度保持规范化。常用谓词对 reading_status、year、node type、edge source/target 和 note paper_id 建索引。
