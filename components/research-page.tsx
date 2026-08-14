"use client";

import { type FormEvent, useEffect, useState } from "react";
import { directions as demoDirections } from "@/lib/demo-data";
import { papers as demoPapers } from "@/lib/demo-data";
import { loadLocalPapers } from "@/lib/local-library";
import {
  loadActiveDirectionId,
  loadResearchDirections,
  saveActiveDirectionId,
  saveResearchDirections,
} from "@/lib/local-research";
import type { Paper, ResearchDirection } from "@/lib/types";
import Link from "next/link";
import { AppShell } from "./app-shell";

interface DirectionDraft {
  title: string;
  description: string;
  keywords: string;
  methods: string;
  problems: string;
  concepts: string;
  notes: string;
}

type EditableSection = "overview" | "methods" | "problems" | "concepts" | "notes";

export function ResearchPage() {
  const [directions, setDirections] = useState(demoDirections);
  const [activeId, setActiveId] = useState(demoDirections[0].id);
  const [editingSection, setEditingSection] = useState<EditableSection>();
  const [creating, setCreating] = useState(false);
  const [papers, setPapers] = useState(demoPapers);
  const [managingPapers, setManagingPapers] = useState(false);
  const [paperQuery, setPaperQuery] = useState("");
  const [draft, setDraft] = useState<DirectionDraft>();

  useEffect(() => {
    queueMicrotask(() => {
      const local = loadResearchDirections();
      setDirections(local);
      setActiveId(loadActiveDirectionId(local) ?? local[0].id);
      setPapers(loadLocalPapers());
    });
  }, []);

  const direction = directions.find((item) => item.id === activeId) ?? directions[0];

  const makeDraft = (item: ResearchDirection): DirectionDraft => ({
    title: item.title,
    description: item.description,
    keywords: item.keywords.join(", "),
    methods: item.relatedMethods.join("\n"),
    problems: item.relatedProblems.join("\n"),
    concepts: item.relatedConcepts.join("\n"),
    notes: item.notes,
  });

  const beginEditing = (section: EditableSection, item = direction) => {
    setDraft(makeDraft(item));
    setEditingSection(section);
  };

  const saveDraft = () => {
    if (!draft) return;
    const next = directions.map((item) => item.id === direction.id ? {
      ...item,
      title: draft.title.trim() || "未命名研究方向",
      description: draft.description.trim(),
      keywords: splitValues(draft.keywords),
      relatedMethods: splitLines(draft.methods),
      relatedProblems: splitLines(draft.problems),
      relatedConcepts: splitLines(draft.concepts),
      notes: draft.notes,
    } : item);
    setDirections(next);
    saveResearchDirections(next);
    setEditingSection(undefined);
    setDraft(undefined);
  };

  const cancelEditing = () => {
    setEditingSection(undefined);
    setDraft(undefined);
  };

  const selectDirection = (id: string) => {
    if (editingSection && draft) saveDraft();
    setActiveId(id);
    saveActiveDirectionId(id);
    setEditingSection(undefined);
    setDraft(undefined);
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
      relatedPaperIds: [],
      relatedMethods: [],
      relatedProblems: [],
      relatedConcepts: [],
    };
    const next = [created, ...directions];
    setDirections(next);
    saveResearchDirections(next);
    setActiveId(created.id);
    saveActiveDirectionId(created.id);
    setCreating(false);
    beginEditing("overview", created);
  };

  const relatedPaperIds = direction.relatedPaperIds ?? [];
  const relatedPapers = relatedPaperIds
    .map((id) => papers.find((paper) => paper.id === id))
    .filter((paper): paper is Paper => Boolean(paper));

  const togglePaper = (paper: Paper) => {
    const nextIds = relatedPaperIds.includes(paper.id)
      ? relatedPaperIds.filter((id) => id !== paper.id)
      : [...relatedPaperIds, paper.id];
    updateDirection({ relatedPaperIds: nextIds });
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
          </div>
        </div>

        <div className="direction-switcher" aria-label="研究方向列表">
          {directions.map((item) => <button key={item.id} className={`direction-tab ${item.id === direction.id ? "active" : ""}`} onClick={() => selectDirection(item.id)}>
            <span>{item.title}</span><small>{item.keywords.slice(0, 3).join(" · ") || "尚未设置关键词"}</small>
          </button>)}
        </div>

        <section className="research-hero">
          <div className="section-head"><span className="eyebrow">当前研究方向 · 进行中</span><div className="inline-actions">
            {editingSection === "overview" ? <><button className="mini-action primary" onClick={saveDraft}>保存</button><button className="mini-action" onClick={cancelEditing}>取消</button></> : <button className="icon-btn" title="编辑方向简介" aria-label="编辑方向简介" onClick={() => beginEditing("overview")}>✎</button>}
            <button className="icon-btn danger" title="删除当前方向" aria-label="删除当前方向" onClick={removeDirection}>×</button>
          </div></div>
          {editingSection === "overview" && draft ? <div className="direction-editor">
            <label className="label">方向名称<input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label className="label">方向描述<textarea className="field" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label className="label">关键词（逗号分隔）<input className="field" value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} /></label>
          </div> : <><h1 style={{ maxWidth: 950, marginTop: 15 }}>{direction.title}</h1><p className="subtle" style={{ maxWidth: 780 }}>{direction.description || "尚未填写方向描述。"}</p></>}
          {editingSection !== "overview" && <div className="tag-row">{direction.keywords.map((keyword) => <span className="tag" key={keyword}>{keyword}</span>)}</div>}
        </section>

        <div className="research-library-layout section">
          <div className="card related-paper-card">
            <div className="section-head"><h2>相关论文</h2><button className="btn" onClick={() => setManagingPapers(true)}>管理论文</button></div>
            {relatedPapers.length ? <div className="direction-paper-list">{relatedPapers.map((paper) => <div className="direction-paper" key={paper.id}>
              <Link href={`/library/${paper.id}`}><strong>{paper.title}</strong><span>{paper.authors.slice(0, 2).join("、") || "作者未填"} · {paper.year || "年份未填"}</span></Link>
              <button className="btn danger" aria-label={`移除 ${paper.title}`} onClick={() => togglePaper(paper)}>移除</button>
            </div>)}</div> : <p className="subtle">尚未关联文献库中的论文。</p>}
          </div>
          <div className="research-side-stack">
            <ResearchList title="相关问题" items={direction.relatedProblems} editing={editingSection === "problems"} draftValue={draft?.problems} onEdit={() => beginEditing("problems")} onSave={saveDraft} onCancel={cancelEditing} onDraftChange={(value) => draft && setDraft({ ...draft, problems: value })} />
            <ResearchList title="相关方法" items={direction.relatedMethods} editing={editingSection === "methods"} draftValue={draft?.methods} onEdit={() => beginEditing("methods")} onSave={saveDraft} onCancel={cancelEditing} onDraftChange={(value) => draft && setDraft({ ...draft, methods: value })} />
          </div>
        </div>
        <section className="section grid cols-2">
          <div className="card"><div className="section-head"><h2>我的笔记</h2>{editingSection === "notes" ? <div className="inline-actions"><button className="mini-action primary" onClick={saveDraft}>保存</button><button className="mini-action" onClick={cancelEditing}>取消</button></div> : <button className="icon-btn" title="编辑我的笔记" aria-label="编辑我的笔记" onClick={() => beginEditing("notes")}>✎</button>}</div>{editingSection === "notes" && draft ? <textarea className="field research-notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /> : <p className="subtle">{direction.notes || "尚未记录笔记。"}</p>}</div>
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

      {managingPapers && <div className="modal-backdrop" role="presentation"><div className="modal paper-manager">
        <div className="section-head"><div><h2>管理“{direction.title}”的论文</h2><p className="meta">已关联 {relatedPaperIds.length} 篇</p></div><button className="btn" onClick={() => setManagingPapers(false)}>完成</button></div>
        <input className="field" value={paperQuery} onChange={(event) => setPaperQuery(event.target.value)} placeholder="搜索标题、作者、标签或摘要…" />
        <div className="paper-picker-list">{papers.filter((paper) => `${paper.title} ${paper.authors.join(" ")} ${paper.tags.join(" ")} ${(paper.autoKeywords ?? []).join(" ")} ${paper.autoSummary ?? ""} ${paper.mySummary ?? ""}`.toLowerCase().includes(paperQuery.toLowerCase())).map((paper) => {
          const selected = relatedPaperIds.includes(paper.id);
          return <button key={paper.id} className={`paper-picker ${selected ? "selected" : ""}`} onClick={() => togglePaper(paper)}>
            <span className="paper-check">{selected ? "✓" : "+"}</span><span><strong>{paper.title}</strong><small>{paper.authors.slice(0, 3).join("、") || "作者未填"} · {paper.year || "年份未填"} · {paper.readingStatus === "read" ? "已读" : paper.readingStatus === "reading" ? "阅读中" : "待读"}</small></span>
          </button>;
        })}</div>
      </div></div>}
    </AppShell>
  );
}

function splitValues(value: string) {
  return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
}

function splitLines(value: string) {
  return value.split(/\n/).map((item) => item.trim()).filter(Boolean);
}

function ResearchList({ title, items, editing, draftValue, onEdit, onSave, onCancel, onDraftChange }: { title: string; items: string[]; editing: boolean; draftValue?: string; onEdit: () => void; onSave: () => void; onCancel: () => void; onDraftChange: (value: string) => void }) {
  return <div className="card"><div className="section-head"><h2>{title}</h2>{editing ? <div className="inline-actions"><button className="mini-action primary" onClick={onSave}>保存</button><button className="mini-action" onClick={onCancel}>取消</button></div> : <button className="icon-btn" title={`编辑${title}`} aria-label={`编辑${title}`} onClick={onEdit}>✎</button>}</div>{editing
    ? <textarea className="field research-list-editor" value={draftValue ?? items.join("\n")} onChange={(event) => onDraftChange(event.target.value)} placeholder="每行填写一项" />
    : items.length ? <ul className="research-list">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="subtle">尚未添加。</p>}
  </div>;
}
