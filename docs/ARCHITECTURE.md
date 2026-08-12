# Architecture

```text
Vinext / React 19 / TypeScript strict
        │
        ├── App routes + client interactions
        ├── Server/API layer
        │       └── Agent tool boundary
        ├── Drizzle ORM
        │       └── Cloudflare D1 (SQLite)
        └── Knowledge Graph
                └── graph_nodes + graph_edges
```

## 选择

- **Vinext + React + TypeScript**：保留 Next.js App Router 编程模型并输出 Cloudflare Worker-compatible ESM。
- **Tailwind 4 + 项目 CSS**：用设计 token 和明确组件类控制科研型界面。
- **D1 / SQLite + Drizzle**：单人项目需要关系查询、索引、迁移与简单运维，不需 Neo4j。
- **轻量 DOM 图谱**：第一版节点规模小，先验证语义模型与交互；数据增长后再评估 React Flow / Cytoscape。
- **Agent tool boundary**：模型不得直接获得所有数据；检索工具返回 data + evidence。

## 数据流

```text
UI mutation → server route → validation → Drizzle → D1
Agent question → tool selection → Literature/Notes/Graph query
               → Evidence Context → Responses API (Phase 2)
               → answer with evidence references
```

## 不采用

Kubernetes、微服务、Redis、Kafka、Neo4j。它们没有解决第一阶段的核心风险：知识结构是否好用、证据是否可追溯。
