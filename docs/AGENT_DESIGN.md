# Agent Design

## 原则

Research Agent 不接收“全部论文拼成一个 prompt”。它通过窄工具检索数据库、笔记与图谱，组成 Evidence Context，再请求模型分析。回答必须携带证据引用；缺证据时明确说明。

## Phase 1 工具

`search_papers()`、`get_paper()`、`search_notes()`、`search_methods()`、`search_problems()`、`search_concepts()`、`search_research_directions()`、`search_graph()`、`get_related_papers()`、`compare_papers()`。

每个工具返回：

```ts
{ data: T; evidence: EvidenceRef[] }
```

EvidenceRef 指向 `paper | note | graph_relation | research_direction`，包含稳定 id、label 与最小 excerpt。

## OpenAI 集成边界

2026-08-12 核对官方 OpenAI 文档后，未来集成应优先使用 **Responses API** 完成 reasoning / tool calling / multi-turn workflow；function tools 用 JSON Schema 描述，tool output 通过 call id 回传；结构化结果使用 Structured Outputs。Codex SDK 可用于把 Codex 作为工程代理嵌入应用，但 ResearchGraph 的研究检索协议仍应与具体模型 SDK 解耦。

密钥只从 `OPENAI_API_KEY` 环境变量读取；`.env.example` 不含真实 credential。

## Phase 2 编排

1. 解析研究问题和 active Research Direction。
2. 选择最少必要工具，限制结果数量。
3. 汇总并去重 Evidence Context。
4. 要求模型输出结构化 `claim + uncertainty + evidence_ids`。
5. 验证每个 evidence_id 存在；无证据 claim 不进入最终回答。
6. 将 AI 建议保存为候选，不自动写为 user-confirmed graph edge。

官方参考：OpenAI Function Calling、Structured Outputs、Responses API migration、Codex SDK 文档。
