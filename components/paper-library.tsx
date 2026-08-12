"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { papers as demoPapers } from "@/lib/demo-data";
import {
  exportLibrary,
  importLibrary,
  loadLocalPapers,
  saveLocalPapers,
} from "@/lib/local-library";
import type { Paper, ReadingStatus } from "@/lib/types";
import { AppShell } from "./app-shell";

const statusLabel: Record<ReadingStatus, string> = {
  to_read: "待读",
  reading: "阅读中",
  read: "已读",
};

export function PaperLibrary() {
  const [items, setItems] = useState(demoPapers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [topic, setTopic] = useState("all");
  const [editing, setEditing] = useState<Paper | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setItems(loadLocalPapers());
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (paper) =>
          (status === "all" || paper.readingStatus === status) &&
          (year === "all" || String(paper.year) === year) &&
          (topic === "all" || paper.tags.includes(topic)) &&
          `${paper.title} ${paper.authors.join(" ")} ${paper.tags.join(" ")} ${paper.mySummary}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, status, year, topic],
  );

  const persist = (papers: Paper[]) => {
    setItems(papers);
    saveLocalPapers(papers);
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const paper: Paper = {
      ...editing,
      id: editing?.id ?? crypto.randomUUID(),
      title: String(form.get("title")).trim(),
      authors: String(form.get("authors"))
        .split(/[,，]/)
        .map((value) => value.trim())
        .filter(Boolean),
      year: Number(form.get("year")) || undefined,
      venue: String(form.get("venue")).trim(),
      doi: String(form.get("doi")).trim(),
      tags: String(form.get("tags"))
        .split(/[,，]/)
        .map((value) => value.trim())
        .filter(Boolean),
      readingStatus: String(form.get("status")) as ReadingStatus,
      mySummary: String(form.get("summary")).trim(),
      myNotes: String(form.get("notes")).trim(),
      researchQuestion: String(form.get("researchQuestion")).trim(),
      methodSummary: String(form.get("methodSummary")).trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
      isDemo: false,
    };
    const next = editing
      ? items.map((item) => (item.id === editing.id ? paper : item))
      : [paper, ...items];
    persist(next);
    setEditing(undefined);
    setNotice("已保存到这台电脑。 ");
  };

  const remove = (id: string) => {
    if (!window.confirm("确定删除这篇论文？建议先导出备份。")) return;
    persist(items.filter((paper) => paper.id !== id));
    setNotice("论文已从本地文献库删除。 ");
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const papers = await importLibrary(file);
      setItems(papers);
      setNotice(`已从备份导入 ${papers.length} 篇论文。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "导入失败。 ");
    }
    event.target.value = "";
  };

  const years = [...new Set(items.map((paper) => paper.year).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
  const topics = [...new Set(items.flatMap((paper) => paper.tags))].sort();

  return (
    <AppShell section="Local Literature Library">
      <div className="content">
        <div className="page-head">
          <div>
            <h1>Literature Library</h1>
            <p className="subtle">
              论文保存在当前浏览器的本地存储中，刷新和重启后仍会保留。
            </p>
          </div>
          <div className="top-actions">
            <button className="btn" onClick={() => exportLibrary(items)}>
              导出备份
            </button>
            <button className="btn" onClick={() => importRef.current?.click()}>
              导入备份
            </button>
            <button className="btn primary" onClick={() => setEditing(null)}>
              ＋ 添加论文
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleImport}
            />
          </div>
        </div>

        {notice && <div className="notice" style={{ marginBottom: 16 }}>{notice}</div>}

        <div className="search-row">
          <input
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、作者、标签或摘要…"
            aria-label="搜索论文"
          />
          <select
            className="field"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="阅读状态"
          >
            <option value="all">全部状态</option>
            <option value="read">已读</option>
            <option value="reading">阅读中</option>
            <option value="to_read">待读</option>
          </select>
          <select
            className="field"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            aria-label="年份"
          >
            <option value="all">全部年份</option>
            {years.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select
            className="field"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            aria-label="研究主题"
          >
            <option value="all">全部主题</option>
            {topics.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <p className="meta">{filtered.length} 篇论文</p>
        <div className="paper-grid">
          {filtered.map((paper) => (
            <article className="card paper-card" key={paper.id}>
              <div className="meta">{paper.year || "年份未填"} · {paper.venue || "Venue 未填"}</div>
              <Link
                href={`/library/${paper.id}`}
                className="paper-title"
                style={{ marginTop: 8 }}
              >
                {paper.title}
              </Link>
              <div className="meta">{paper.authors.join(", ") || "作者未填"}</div>
              <p className="paper-summary">
                {paper.mySummary || "尚未填写一句话总结。"}
              </p>
              <div className="tag-row">
                {paper.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                {paper.isDemo && <span className="tag demo">DEMO</span>}
              </div>
              <div className="paper-foot">
                <span className={`status ${paper.readingStatus}`}>
                  {statusLabel[paper.readingStatus]}
                </span>
                <div>
                  <button className="btn" onClick={() => setEditing(paper)}>编辑</button>{" "}
                  <button className="btn danger" onClick={() => remove(paper.id)}>删除</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {editing !== undefined && (
          <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setEditing(undefined);
            }}
          >
            <form className="modal" onSubmit={save}>
              <div className="section-head">
                <h2>{editing ? "编辑论文" : "添加论文"}</h2>
                <button type="button" className="btn" onClick={() => setEditing(undefined)}>
                  关闭
                </button>
              </div>
              <div className="form-grid">
                <label className="label wide">标题<input required name="title" className="field" defaultValue={editing?.title} /></label>
                <label className="label wide">作者（逗号分隔）<input name="authors" className="field" defaultValue={editing?.authors.join(", ")} /></label>
                <label className="label">年份<input name="year" type="number" className="field" defaultValue={editing?.year} /></label>
                <label className="label">Venue<input name="venue" className="field" defaultValue={editing?.venue} /></label>
                <label className="label">DOI<input name="doi" className="field" defaultValue={editing?.doi} /></label>
                <label className="label">阅读状态<select name="status" className="field" defaultValue={editing?.readingStatus ?? "to_read"}><option value="to_read">待读</option><option value="reading">阅读中</option><option value="read">已读</option></select></label>
                <label className="label wide">标签（逗号分隔）<input name="tags" className="field" defaultValue={editing?.tags.join(", ")} /></label>
                <label className="label wide">一句话总结<textarea name="summary" className="field" defaultValue={editing?.mySummary} /></label>
                <label className="label wide">Research Question<textarea name="researchQuestion" className="field" defaultValue={editing?.researchQuestion} /></label>
                <label className="label wide">Method Summary<textarea name="methodSummary" className="field" defaultValue={editing?.methodSummary} /></label>
                <label className="label wide">我的笔记<textarea name="notes" className="field" defaultValue={editing?.myNotes} /></label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button className="btn primary">保存到本地</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
