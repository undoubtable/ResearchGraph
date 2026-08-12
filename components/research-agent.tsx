"use client";

import { type FormEvent, useState } from "react";
import { researchTools, type EvidenceRef } from "@/lib/agent/tools";
import { AppShell } from "./app-shell";
import { evidenceKindLabel } from "@/lib/ui-labels";

type Message = { role: "user" | "agent"; text: string; evidence?: EvidenceRef[] };
const toolNames = Object.keys(researchTools) as (keyof typeof researchTools)[];
const toolLabel: Record<string, string> = {
  search_papers: "搜索论文",
  get_paper: "读取论文",
  search_notes: "搜索笔记",
  search_methods: "搜索方法",
  search_problems: "搜索问题",
  search_concepts: "搜索概念",
  search_research_directions: "搜索研究方向",
  search_graph: "搜索图谱",
  get_related_papers: "查找相关论文",
  compare_papers: "比较论文",
};

export function ResearchAgent() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "agent",
    text: "这是证据优先的科研助手。目前可以检索演示文献、个人笔记和图谱关系，并展示支撑结果的证据；不会凭空生成科研建议。",
    evidence: [{ kind: "research_direction", id: "ocean-ns", label: "当前研究方向", excerpt: "面向可解释海洋涡旋识别的神经符号推理" }],
  }]);
  const [input, setInput] = useState("");

  const send = (event: FormEvent) => {
    event.preventDefault();
    const query = input.trim();
    if (!query) return;
    const evidence = [
      ...researchTools.search_papers(query).evidence,
      ...researchTools.search_graph(query).evidence,
      ...researchTools.search_notes(query).evidence,
    ].slice(0, 5);
    const answer = evidence.length
      ? `在当前知识库中找到 ${evidence.length} 条相关证据。第一阶段仅返回可追溯的检索结果；后续接入模型后再生成分析与科研建议。`
      : `当前知识库中没有找到可直接支持“${query}”的证据。我不会用模型记忆补齐答案，请先添加或整理相关论文、笔记与图谱关系。`;
    setMessages((current) => [...current, { role: "user", text: query }, { role: "agent", text: answer, evidence }]);
    setInput("");
  };

  return <AppShell section="科研助手"><div className="content">
    <div className="page-head"><div><h1>科研助手</h1><p className="subtle">文献库 + 笔记 + 知识图谱 → 证据上下文 → 研究分析</p></div><span className="status-pill"><span className="evidence-dot" />检索工具已就绪</span></div>
    <div className="agent-shell"><section className="card chat"><div className="chat-log">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}>{message.text}{message.evidence && message.evidence.length > 0 && <div className="evidence"><div className="evidence-title">支撑证据 · {message.evidence.length} 条来源</div>{message.evidence.map((evidence) => <div className="evidence-item" key={`${evidence.kind}-${evidence.id}`}><strong>{evidence.label}</strong><br />{evidence.excerpt}<div className="eyebrow" style={{ marginTop: 5 }}>{evidenceKindLabel[evidence.kind] ?? "证据"} · {evidence.id}</div></div>)}</div>}</div>)}</div><form className="composer" onSubmit={send}><input className="field" value={input} onChange={(event) => setInput(event.target.value)} placeholder="检索你的论文、笔记和图谱证据…" aria-label="科研助手问题" /><button className="btn primary">检索证据</button></form></section>
      <aside className="card"><span className="eyebrow">可用工具</span><p className="subtle" style={{ marginTop: 10 }}>这些检索接口已可在本地运行，下一阶段再接入模型编排。</p><div className="tool-list">{toolNames.map((tool) => <div className="tool ready" key={tool}>{toolLabel[tool] ?? tool}</div>)}</div><div className="notice" style={{ marginTop: 16 }}>当前不调用大语言模型，也不需要 API 密钥。未来接入时，密钥只从本地环境变量读取。</div></aside>
    </div>
  </div></AppShell>;
}
