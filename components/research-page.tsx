"use client";

import { type FormEvent, useEffect, useState } from "react";
import { directions as demoDirections } from "@/lib/demo-data";
import {
  loadActiveDirectionId,
  loadResearchDirections,
  saveActiveDirectionId,
  saveResearchDirections,
} from "@/lib/local-research";
import type { ResearchDirection } from "@/lib/types";
import { AppShell } from "./app-shell";

export function ResearchPage() {
  const [directions, setDirections] = useState(demoDirections);
  const [activeId, setActiveId] = useState(demoDirections[0].id);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const local = loadResearchDirections();
      setDirections(local);
      setActiveId(loadActiveDirectionId(local) ?? local[0].id);
    });
  }, []);

  const direction = directions.find((item) => item.id === activeId) ?? directions[0];

  const selectDirection = (id: string) => {
    setActiveId(id);
    saveActiveDirectionId(id);
    setEditing(false);
  };

  const updateDirection = (update: Partial<ResearchDirection>) => {
    const next = directions.map((item) => item.id === direction.id ? { ...item, ...update } : item);
    setDirections(next);
    saveResearchDirections(next);
  };

  const createDirection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const created: ResearchDirection = {
      id: crypto.randomUUID(),
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      keywords: splitValues(String(form.get("keywords"))),
      notes: "",
      relatedPapers: [],
      relatedMethods: [],
      relatedProblems: [],
      relatedConcepts: [],
    };
    const next = [created, ...directions];
    setDirections(next);
    saveResearchDirections(next);
    selectDirection(created.id);
    setCreating(false);
    setEditing(true);
  };

  const removeDirection = () => {
    if (directions.length === 1) {
      window.alert("至少需要保留一个研究方向。 ");
      return;
    }
    if (!window.confirm(`确定删除研究方向“${direction.title}”？`)) return;
    const next = directions.filter((item) => item.id !== direction.id);
    setDirections(next);
    saveResearchDirections(next);
    selectDirection(next[0].id);
  };

  return (
    <AppShell section="我的研究">
      <div className="content">
        <div className="page-head">
          <div><h1>我的研究</h1><p className="subtle">每个方向拥有独立的上下文、关联文献与研究笔记，可随时切换当前方向。</p></div>
          <div className="top-actions">
            <button className="btn" onClick={() => setCreating(true)}>＋ 新建方向</button>
            <button className="btn primary" onClick={() => setEditing(!editing)}>{editing ? "完成编辑" : "编辑当前方向"}</button>
          </div>
        </div>

        <div className="direction-switcher" aria-label="研究方向列表">
          {directions.map((item) => <button key={item.id} className={`direction-tab ${item.id === direction.id ? "active" : ""}`} onClick={() => selectDirection(item.id)}>
            <span>{item.title}</span><small>{item.keywords.slice(0, 3).join(" · ") || "尚未设置关键词"}</small>
          </button>)}
        </div>

        <section className="research-hero">
          <div className="section-head"><span className="eyebrow">当前研究方向 · 进行中</span>{editing && <button className="btn danger" onClick={removeDirection}>删除方向</button>}</div>
          {editing ? <div className="direction-editor">
            <label className="label">方向名称<input className="field" value={direction.title} onChange={(event) => updateDirection({ title: event.target.value })} /></label>
            <label className="label">方向描述<textarea className="field" value={direction.description} onChange={(event) => updateDirection({ description: event.target.value })} /></label>
            <label className="label">关键词（逗号分隔）<input className="field" value={direction.keywords.join(", ")} onChange={(event) => updateDirection({ keywords: splitValues(event.target.value) })} /></label>
          </div> : <><h1 style={{ maxWidth: 950, marginTop: 15 }}>{direction.title}</h1><p className="subtle" style={{ maxWidth: 780 }}>{direction.description || "尚未填写方向描述。"}</p></>}
          {!editing && <div className="tag-row">{direction.keywords.map((keyword) => <span className="tag" key={keyword}>{keyword}</span>)}</div>}
        </section>

        <div className="research-columns section">
          <ResearchList title="相关论文" items={direction.relatedPapers} editing={editing} onChange={(items) => updateDirection({ relatedPapers: items })} />
          <ResearchList title="相关方法" items={direction.relatedMethods} editing={editing} onChange={(items) => updateDirection({ relatedMethods: items })} />
          <ResearchList title="相关问题" items={direction.relatedProblems} editing={editing} onChange={(items) => updateDirection({ relatedProblems: items })} />
          <ResearchList title="相关概念" items={direction.relatedConcepts} editing={editing} onChange={(items) => updateDirection({ relatedConcepts: items })} />
        </div>
        <section className="section grid cols-2">
          <div className="card"><h2>我的笔记</h2>{editing ? <textarea className="field research-notes" value={direction.notes} onChange={(event) => updateDirection({ notes: event.target.value })} /> : <p className="subtle">{direction.notes || "尚未记录笔记。"}</p>}</div>
          <div className="card gap-box"><span className="eyebrow">潜在研究缺口 · 待分析</span><h2 style={{ marginTop: 12 }}>等待证据积累</h2><p className="subtle">系统将针对当前方向，结合关联文献、个人笔记和可信图关系识别候选缺口。</p></div>
        </section>
      </div>

      {creating && <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={createDirection}>
        <div className="section-head"><h2>新建研究方向</h2><button type="button" className="btn" onClick={() => setCreating(false)}>关闭</button></div>
        <div className="form-grid">
          <label className="label wide">方向名称<input required name="title" className="field" placeholder="例如：多模态遥感变化检测" /></label>
          <label className="label wide">方向描述<textarea name="description" className="field" placeholder="这个方向主要解决什么问题？" /></label>
          <label className="label wide">关键词（逗号分隔）<input name="keywords" className="field" /></label>
        </div>
        <div className="modal-actions"><button className="btn primary">创建并开始编辑</button></div>
      </form></div>}
    </AppShell>
  );
}

function splitValues(value: string) {
  return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
}

function ResearchList({ title, items, editing, onChange }: { title: string; items: string[]; editing: boolean; onChange: (items: string[]) => void }) {
  return <div className="card"><h2>{title}</h2>{editing
    ? <textarea className="field research-list-editor" value={items.join("\n")} onChange={(event) => onChange(splitValues(event.target.value))} placeholder="每行填写一项" />
    : items.length ? <ul className="research-list">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="subtle">尚未添加。</p>}
  </div>;
}
