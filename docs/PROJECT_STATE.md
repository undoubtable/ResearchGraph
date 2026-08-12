# Project State

更新时间：2026-08-12

## 已完成

- Phase 0：竞品审计、产品设计、信息架构、数据模型、技术架构、项目初始化。
- Phase 1：Dashboard、Literature Library、添加/编辑/删除、搜索与筛选、Paper Detail、Notes、Tags、My Research、Knowledge Graph、手工建立关系、Research Agent UI 骨架和 10 个工具接口。
- D1/SQLite Drizzle schema、迁移、索引、演示数据、TypeScript strict、基本测试、响应式 UI。
- demo 记录显式标注，避免把未核实 metadata 当作事实。

## 未完成

- CRUD 当前 UI 交互是会话内演示；D1 schema 已就绪，但论文、笔记、图关系的完整 server action/API 持久化尚未接通。
- PDF 上传、R2 存储、全文解析、embedding、semantic retrieval、联网找论文。
- Responses API / Codex SDK 的真实模型调用。
- 自动图谱抽取、Research Gap discovery 与科研建议。
- 大规模图谱布局和图数据库迁移。

## 项目结构

```text
app/          routes + API
components/   product UI
lib/          types, demo data, agent tools
db/           Drizzle schema
drizzle/      D1 migration
docs/         design and handoff documents
tests/        structural tests
worker/       Cloudflare Worker entry
```

## 启动

Node.js 22.13+；执行 `npm install`，然后 `npm run dev`。验证命令见 README。

## 下一阶段建议

严格按以下流水线推进，先保证每个阶段都有可观察产物和人工确认点：

```text
PDF → R2 object + metadata → text extraction → Structured Paper review
    → chunk + embedding → hybrid retrieval → candidate graph extraction
    → user confirmation → Codex Research Agent with cited evidence
```

先接通 D1 CRUD 与 R2 上传；再实现可重复的 PDF parser 和结构化抽取评估集；embedding 与自动 graph extraction 必须在人工校验数据上评估后上线。

## 已知问题

- 当前演示图谱使用轻量固定布局；适合少量节点，不适合数百节点。
- 演示 CRUD 刷新后还原，直到 server mutation 接通 D1。
- 演示文献中不可靠的作者/venue 均标为 Demo record。

## 质量验证

- `npm install`：通过（本机网络权限放行后）。
- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm test`：通过，3/3。
- `npm run build`：通过，7 个 route 成功产出 Cloudflare Worker-compatible bundle。
