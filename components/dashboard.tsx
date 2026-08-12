"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { directions as demoDirections, edges, papers as demoPapers } from "@/lib/demo-data";
import { loadLocalPapers } from "@/lib/local-library";
import { loadActiveDirectionId, loadResearchDirections } from "@/lib/local-research";
import type { ResearchDirection } from "@/lib/types";
import { createdByLabel, relationTypeLabel } from "@/lib/ui-labels";
import { AppShell } from "./app-shell";

export function Dashboard() {
  const [papers, setPapers] = useState(demoPapers);
  const [directions, setDirections] = useState(demoDirections);
  const [activeDirection, setActiveDirection] = useState<ResearchDirection>(demoDirections[0]);

  useEffect(() => {
    const refresh = () => setPapers(loadLocalPapers());
    queueMicrotask(refresh);
    window.addEventListener("researchgraph:papers", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("researchgraph:papers", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const refresh = () => {
      const local = loadResearchDirections();
      const activeId = loadActiveDirectionId(local);
      setDirections(local);
      setActiveDirection(local.find((direction) => direction.id === activeId) ?? local[0]);
    };
    queueMicrotask(refresh);
    window.addEventListener("researchgraph:directions", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("researchgraph:directions", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const read = papers.filter((paper) => paper.readingStatus === "read").length;
  const notes = papers.filter((paper) => paper.myNotes?.trim()).length;

  return <AppShell section="研究总览"><div className="content"><div className="page-head"><div><h1>你的研究，正在形成结构。</h1><p className="subtle">从读过的论文开始，把方法、问题、概念与判断连接成可验证的知识网络。</p></div><Link href="/library" className="btn primary">＋ 添加论文</Link></div>
    <div className="grid cols-4"><div className="card metric"><span className="eyebrow">文献库</span><span className="metric-value">{papers.length}</span><span className="metric-note">篇文献 · {read} 篇已读</span></div><div className="card metric"><span className="eyebrow">知识图谱</span><span className="metric-value">10</span><span className="metric-note">节点 · {edges.length} 条关系</span></div><div className="card metric"><span className="eyebrow">研究笔记</span><span className="metric-value">{notes}</span><span className="metric-note">来自你的本地文献</span></div><div className="card metric"><span className="eyebrow">研究方向</span><span className="metric-value">{directions.length}</span><span className="metric-note">当前：{activeDirection.title}</span></div></div>
    <section className="section grid cols-2"><div className="card direction-card"><span className="eyebrow" style={{ color: "#a9bdad" }}>当前研究方向 · 进行中</span><h2>{activeDirection.title}</h2><p className="subtle">{activeDirection.description || "尚未填写方向描述。"}</p><Link href="/research" className="btn direction-action">管理研究方向 →</Link></div><div className="card"><div className="section-head"><h2>当前方向关键词</h2><span className="meta">{directions.length} 个研究方向</span></div><div className="topic-keywords">{activeDirection.keywords.length ? activeDirection.keywords.map((keyword) => <span className="tag" key={keyword}>{keyword}</span>) : <p className="subtle">尚未设置关键词。</p>}</div></div></section>
    <section className="section grid cols-2"><div className="card"><div className="section-head"><h2>最近阅读</h2><Link href="/library" className="meta">全部文献 →</Link></div><div className="list">{papers.slice(0,3).map((paper)=><Link href={`/library/${paper.id}`} className="list-row" key={paper.id}><div><div className="paper-title">{paper.title}</div><div className="meta">{paper.authors.slice(0,2).join(", ") || "作者未填"} · {paper.year || "年份未填"}</div></div><span className={`status ${paper.readingStatus}`}>{paper.readingStatus === "read" ? "已读" : paper.readingStatus === "reading" ? "阅读中" : "待读"}</span></Link>)}</div></div><div className="card"><div className="section-head"><h2>最近建立的关系</h2><Link href="/graph" className="meta">打开图谱 →</Link></div><div className="list">{edges.slice(-3).reverse().map((edge)=><div className="list-row" key={edge.id}><div><div className="eyebrow">{relationTypeLabel[edge.relationType]}</div><div className="meta" style={{ marginTop: 6 }}>{edge.evidence}</div></div><span className="tag">{createdByLabel[edge.createdBy]}</span></div>)}</div></div></section>
  </div></AppShell>;
}
