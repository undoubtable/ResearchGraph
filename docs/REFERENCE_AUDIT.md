# Reference Audit

调研日期：2026-08-12。原则：只学习公开架构和产品模式，不复制受版权保护或许可证不兼容的代码。

| Product | 值得借鉴 | 不适合直接使用 | ResearchGraph 如何改进 |
|---|---|---|---|
| Paperlib（开源） | 论文条目是核心对象；metadata 抓取与编辑、标签、文件夹、评分、笔记和插件边界 | 桌面端复杂度与现有实现不直接移植；需单独复核每个依赖和许可证 | 保留轻量条目模型，把科研问题、方法、数据、结果、局限提升为一级字段 |
| Zotero（开源） | Library / Collection / Tag / Note / Attachment 的成熟分层；同一条目可属于多个 collection，类似 playlist | 引文写作、同步和通用资源类型超出第一阶段；不复制其代码或 schema | 保留 Library、标签、笔记和附件边界；用 Research Direction 代替仅面向归档的文件夹视角 |
| ResearchRabbit（商业产品） | seed paper、collection、related/earlier/later works、图谱导航 | 推荐算法、内部数据和实现不可复制；纯 paper graph 不足以表达科研语义 | 图中加入 Method、Problem、Concept、Dataset、ResearchIdea，并为关系保留证据和来源 |
| Litmaps（商业产品） | 从 seed 启动的引文网络、可视地图、发现路径 | 引文网络只能表示文献连接；产品实现与算法不可复制 | 引文或相似性以后仅作为一种关系来源，不能替代科研语义关系 |
| Connected Papers（商业产品） | 相似度空间、prior/derivative works 和清晰的图交互 | 相似度不是因果、支持或方法关系；商业实现不可复制 | 节点距离与关系类型分离，用户可看到 relation type、confidence、evidence |
| NotebookLM（商业产品） | AI 基于用户 sources 回答，并提供可核验引用 | 不可复制模型、检索实现或交互资产；citation 也不等于事实已验证 | 每条 Agent 结论必须关联 Paper / Note / Graph Relation evidence；无证据时明确拒答 |
| Reor（开源，仓库显示本地 AI 知识管理方向） | Markdown、本地知识、自动关联、embedding、semantic search、RAG 的 local-first 思路 | AGPL 类项目需谨慎对待代码复用；其桌面笔记架构不直接适配本项目 | 只借鉴 local-first 和 related knowledge 思想；自建简洁数据层，第二阶段再加入 embedding |

## 开源与商业边界

- 可研究公开源码：Paperlib、Zotero、Reor。研究不等于复制；实现前仍需确认准确 LICENSE、版本与依赖许可证。
- 只参考产品逻辑：ResearchRabbit、Litmaps、Connected Papers、NotebookLM。不得逆向或复制内部代码、算法与受保护 UI 资产。

## 结论

ResearchGraph 的差异化不是“又一个 PDF 管理器”，而是把个人阅读后的结构化判断作为核心资产：文献管理提供可靠底座，语义知识图谱表达科研关系，Research Direction 限定分析目标，Agent 只在可追溯证据上工作。

## 本次查阅来源

- Paperlib GitHub repository / development links
- Zotero 官方 Quick Start、Collections and Tags、Library Items、Notes 文档
- ResearchRabbit 产品资料与 PMC 产品评述
- Litmaps 官方 Introduction 与 visualization 文档
- Connected Papers 官方 About / FAQ
- Google Workspace NotebookLM 产品页
- Reor GitHub repository
