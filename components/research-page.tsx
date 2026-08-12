"use client";

import { useState } from "react";
import { directions } from "@/lib/demo-data";
import { AppShell } from "./app-shell";

export function ResearchPage() {
  const [direction, setDirection] = useState(directions[0]);
  const [editing, setEditing] = useState(false);
  return (
    <AppShell section="我的研究">
      <div className="content">
        <div className="page-head">
          <div>
            <h1>我的研究</h1>
            <p className="subtle">研究方向不是文件夹，而是科研助手分析文献时必须遵守的上下文与边界。</p>
          </div>
          <button className="btn" onClick={() => setEditing(!editing)}>{editing ? "完成编辑" : "编辑方向"}</button>
        </div>
        <section className="research-hero">
          <span className="eyebrow">当前研究方向 · 进行中</span>
          {editing ? <>
            <input className="field" style={{ margin: "15px 0 10px", fontSize: 20 }} value={direction.title} onChange={(event) => setDirection({ ...direction, title: event.target.value })} />
            <textarea className="field" value={direction.description} onChange={(event) => setDirection({ ...direction, description: event.target.value })} />
          </> : <>
            <h1 style={{ maxWidth: 950, marginTop: 15 }}>{direction.title}</h1>
            <p className="subtle" style={{ maxWidth: 780 }}>{direction.description}</p>
          </>}
          <div className="tag-row">{direction.keywords.map((keyword) => <span className="tag" key={keyword}>{keyword}</span>)}</div>
        </section>
        <div className="research-columns section">
          <ResearchList title="相关论文" items={direction.relatedPapers} />
          <ResearchList title="相关方法" items={direction.relatedMethods} />
          <ResearchList title="相关问题" items={direction.relatedProblems} />
          <ResearchList title="相关概念" items={direction.relatedConcepts} />
        </div>
        <section className="section grid cols-2">
          <div className="card"><h2>我的笔记</h2>{editing ? <textarea className="field" value={direction.notes} onChange={(event) => setDirection({ ...direction, notes: event.target.value })} /> : <p className="subtle">{direction.notes}</p>}</div>
          <div className="card gap-box"><span className="eyebrow">潜在研究缺口 · 待分析</span><h2 style={{ marginTop: 12 }}>等待证据积累</h2><p className="subtle">下一阶段将通过已读文献、个人笔记和可信图关系识别候选缺口。当前不自动生成科研建议，避免脱离证据。</p></div>
        </section>
      </div>
    </AppShell>
  );
}

function ResearchList({ title, items }: { title: string; items: string[] }) {
  return <div className="card"><h2>{title}</h2><ul className="research-list">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}
