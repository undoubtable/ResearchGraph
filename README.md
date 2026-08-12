# ResearchGraph

ResearchGraph 是一个 **Personal AI Research Knowledge System**。它不把 PDF 当作系统中心，而把论文转化为结构化科研知识、可审计的知识图谱，并为证据驱动的 Research Agent 提供工具接口。

```text
Paper → Structured Research Knowledge → Knowledge Graph → Research Agent
```

## 当前能力

- Dashboard：研究方向、文献、笔记、主题与最近关系概览
- Literature Library：添加、编辑、删除、搜索、标签、阅读状态、年份与主题筛选
- Paper Detail：元数据、研究问题、方法、数据集、贡献、结果、局限、笔记、灵感与图关系
- My Research：研究方向及关联论文、方法、问题、概念与笔记
- Knowledge Graph：六类节点、十类关系、搜索、筛选、缩放、节点详情与手工建边
- Research Agent：10 个 evidence-first 工具接口和不凭空回答的 UI 骨架
- D1/SQLite 数据模型、Drizzle schema 与首个迁移

## 启动

要求 Node.js 22.13+。

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 环境变量

当前 MVP 不调用模型。未来 Agent 集成时复制 `.env.example` 为 `.env.local` 并设置 `OPENAI_API_KEY`；不要提交真实凭据。

## 文档

- [参考系统审计](docs/REFERENCE_AUDIT.md)
- [产品设计](docs/PRODUCT_DESIGN.md)
- [架构](docs/ARCHITECTURE.md)
- [数据模型](docs/DATA_MODEL.md)
- [Agent 设计](docs/AGENT_DESIGN.md)
- [项目状态](docs/PROJECT_STATE.md)

演示数据中只有 `Concept Bottleneck Models` 使用了基本的公开元数据；其余不确定记录均明确标记为 Demo，不应直接用于学术引用。
