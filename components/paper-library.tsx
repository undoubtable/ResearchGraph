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
import { deletePaperFile, getPaperFileUrl, savePaperFile } from "@/lib/local-files";
import {
  extractPdfSearchText,
  chooseMetadataMatch,
  type PaperMetadataCandidate,
  searchPaperMetadata,
} from "@/lib/paper-metadata";
import { paperSourceUrl } from "@/lib/paper-link";
import type { Paper, ReadingStatus } from "@/lib/types";
import { AppShell } from "./app-shell";

const statusLabel: Record<ReadingStatus, string> = {
  to_read: "待读",
  reading: "阅读中",
  read: "已读",
};

function paperKeywords(paper: Paper) {
  return [...new Set([...(paper.autoKeywords ?? []), ...paper.tags])];
}

function paperSearchText(paper: Paper) {
  return `${paper.title} ${paper.authors.join(" ")} ${paperKeywords(paper).join(" ")} ${paper.autoSummary ?? ""} ${paper.mySummary ?? ""}`;
}

export function PaperLibrary() {
  const [items, setItems] = useState(demoPapers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [topic, setTopic] = useState("all");
  const [editing, setEditing] = useState<Paper | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [metadata, setMetadata] = useState<PaperMetadataCandidate>();
  const [candidates, setCandidates] = useState<PaperMetadataCandidate[]>([]);
  const [searchingMetadata, setSearchingMetadata] = useState(false);
  const [refreshingIds, setRefreshingIds] = useState<string[]>([]);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [metadataNotice, setMetadataNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLFormElement>(null);

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
          (topic === "all" || paperKeywords(paper).includes(topic)) &&
          paperSearchText(paper)
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, status, year, topic],
  );

  const persist = (papers: Paper[]) => {
    setItems(papers);
    saveLocalPapers(papers);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source = String(form.get("source")).trim();
    const uploaded = form.get("pdfFile");
    const pdfFile = uploaded instanceof File && uploaded.size > 0 ? uploaded : undefined;
    if (!editing && !source && !pdfFile) {
      setNotice("请上传一个 PDF 文件，或者粘贴论文链接。 ");
      return;
    }
    const doiFromSource = source
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
      .replace(/^doi:\s*/i, "");
    const sourceIsDoi = /^10\.\d{4,9}\//i.test(doiFromSource);
    let resolvedMetadata = metadata;
    if (!resolvedMetadata && source) {
      setMetadataNotice(sourceIsDoi ? "正在通过 DOI 获取论文信息并查找可用 PDF…" : "正在根据标题自动匹配论文信息…");
      try {
        const results = await searchPaperMetadata(sourceIsDoi ? doiFromSource : source);
        resolvedMetadata = chooseMetadataMatch(sourceIsDoi ? doiFromSource : source, results).selected;
      } catch {
        // 查询失败时仍保留用户输入，允许稍后再次补全。
      }
    }
    const id = editing?.id ?? crypto.randomUUID();
    const enteredTitle = String(form.get("title")).trim();
    const enteredAuthors = String(form.get("authors"))
      .split(/[,，]/)
      .map((value) => value.trim())
      .filter(Boolean);
    const linkTitle = source
      ? decodeURIComponent(source.split(/[/?#]/).filter(Boolean).at(-1) || "链接论文")
          .replace(/[-_]+/g, " ")
          .replace(/\.pdf$/i, "")
      : "";
    const paper: Paper = {
      ...editing,
      id,
      title: enteredTitle || resolvedMetadata?.title || pdfFile?.name.replace(/\.pdf$/i, "") || editing?.title || linkTitle,
      authors: enteredAuthors.length ? enteredAuthors : resolvedMetadata?.authors ?? [],
      year: Number(form.get("year")) || resolvedMetadata?.year || undefined,
      venue: String(form.get("venue")).trim() || resolvedMetadata?.venue || "",
      doi: sourceIsDoi ? doiFromSource : resolvedMetadata?.doi || "",
      url: source && !sourceIsDoi ? source : resolvedMetadata?.url || "",
      pdfUrl: resolvedMetadata?.pdfUrl || editing?.pdfUrl,
      attachmentName: pdfFile?.name || editing?.attachmentName,
      tags: (String(form.get("tags"))
        .split(/[,，]/)
        .map((value) => value.trim())
        .filter(Boolean).length ? String(form.get("tags"))
          .split(/[,，]/)
          .map((value) => value.trim())
          .filter(Boolean) : editing?.tags) ?? [],
      autoKeywords: resolvedMetadata?.keywords?.length ? resolvedMetadata.keywords : editing?.autoKeywords,
      readingStatus: String(form.get("status")) as ReadingStatus,
      abstract: resolvedMetadata?.abstract || editing?.abstract,
      mySummary: String(form.get("summary")).trim() || editing?.mySummary || "",
      autoSummary: resolvedMetadata?.summary || editing?.autoSummary,
      myNotes: String(form.get("notes")).trim(),
      researchQuestion: String(form.get("researchQuestion")).trim(),
      methodSummary: String(form.get("methodSummary")).trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
      isDemo: false,
    };
    if (pdfFile) {
      try {
        await savePaperFile(id, pdfFile);
      } catch {
        setNotice("PDF 保存失败，可能是浏览器存储空间不足。论文信息尚未保存。 ");
        return;
      }
    }
    const next = editing
      ? items.map((item) => (item.id === editing.id ? paper : item))
      : [paper, ...items];
    persist(next);
    setEditing(undefined);
    setNotice("已保存到这台电脑。 ");
  };

  const remove = async (id: string) => {
    if (!window.confirm("确定删除这篇论文？建议先导出备份。")) return;
    await deletePaperFile(id);
    persist(items.filter((paper) => paper.id !== id));
    setNotice("论文已从本地文献库删除。 ");
  };

  const openEditor = (paper: Paper | null) => {
    setEditing(paper);
    setMetadata(undefined);
    setCandidates([]);
    setMetadataNotice("");
  };

  const findMetadata = async (query: string) => {
    if (!query.trim()) return;
    setSearchingMetadata(true);
    setMetadataNotice("正在查询公开学术数据库…");
    try {
      const results = await searchPaperMetadata(query);
      const match = chooseMetadataMatch(query, results);
      setMetadata(match.selected);
      setCandidates(match.ambiguous);
      setMetadataNotice(match.selected
        ? "已根据 DOI 或标题自动匹配并补全论文信息。"
        : match.ambiguous.length
          ? "检索到几篇标题相近的论文，无法可靠区分，请确认一次。"
          : "没有找到标题足够接近的论文，仍可直接保存。 ");
    } catch (error) {
      setMetadataNotice(error instanceof Error ? error.message : "自动查询失败，仍可直接保存。 ");
    } finally {
      setSearchingMetadata(false);
    }
  };

  const identifyPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMetadataNotice("正在本地识别 PDF，并搜索论文信息…");
    try {
      await findMetadata(await extractPdfSearchText(file));
    } catch {
      await findMetadata(file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " "));
    }
  };

  const searchFromLink = () => {
    if (!editorRef.current) return;
    const source = String(new FormData(editorRef.current).get("source") ?? "");
    if (!source.trim()) {
      setMetadataNotice("请先粘贴论文链接、DOI 或论文标题。 ");
      return;
    }
    void findMetadata(source);
  };

  const openLocalFile = async (paper: Paper) => {
    const tab = window.open("about:blank", "_blank");
    const fileUrl = await getPaperFileUrl(paper.id);
    if (fileUrl && tab) {
      tab.location.href = fileUrl;
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } else {
      tab?.close();
      setNotice("没有找到这篇论文的本地文件，请重新编辑并上传。 ");
    }
  };

  const refreshPaperData = async (paper: Paper) => {
    const lookup = paper.doi || paper.title;
    const results = await searchPaperMetadata(lookup);
    const match = chooseMetadataMatch(lookup, results);
    const found = match.selected ?? (paper.doi ? results[0] : undefined);
    if (!found) throw new Error("没有找到标题足够接近的公开论文记录");
    const now = new Date().toISOString();
    return {
      ...paper,
      title: found.title || paper.title,
      authors: found.authors.length ? found.authors : paper.authors,
      year: found.year || paper.year,
      venue: found.venue || paper.venue,
      doi: found.doi || paper.doi,
      url: found.url || paper.url,
      pdfUrl: found.pdfUrl || paper.pdfUrl,
      abstract: found.abstract || paper.abstract,
      autoKeywords: found.keywords?.length ? found.keywords : paper.autoKeywords,
      autoSummary: found.summary || paper.autoSummary,
      metadataRefreshedAt: now,
      updatedAt: now.slice(0, 10),
      isDemo: false,
    } satisfies Paper;
  };

  const refreshOnePaper = async (paper: Paper) => {
    setRefreshingIds((current) => [...current, paper.id]);
    setNotice(`正在刷新《${paper.title}》的资料…`);
    try {
      const updated = await refreshPaperData(paper);
      persist(items.map((item) => item.id === paper.id ? updated : item));
      setNotice(updated.pdfUrl
        ? "资料已刷新，并已找到可直接打开的 PDF。"
        : "资料已刷新；暂未发现开放 PDF，本地文件和个人笔记均已保留。 ");
    } catch (error) {
      setNotice(error instanceof Error ? `刷新失败：${error.message}。` : "刷新失败，请稍后再试。 ");
    } finally {
      setRefreshingIds((current) => current.filter((id) => id !== paper.id));
    }
  };

  const refreshAllPapers = async () => {
    if (!items.length || refreshingAll) return;
    setRefreshingAll(true);
    let next = [...items];
    let refreshed = 0;
    let failed = 0;
    for (const [index, paper] of items.entries()) {
      setNotice(`正在刷新第 ${index + 1}/${items.length} 篇：《${paper.title}》…`);
      try {
        const updated = await refreshPaperData(paper);
        next = next.map((item) => item.id === paper.id ? updated : item);
        persist(next);
        refreshed += 1;
      } catch {
        failed += 1;
      }
    }
    setRefreshingAll(false);
    setNotice(`全部刷新完成：成功 ${refreshed} 篇，未匹配 ${failed} 篇。PDF、笔记和研究方向关联均未改动。`);
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
  const topics = [...new Set(items.flatMap(paperKeywords))].sort();

  return (
    <AppShell section="本地文献库">
      <div className="content">
        <div className="page-head">
          <div>
            <h1>文献库</h1>
            <p className="subtle">
              论文信息和上传的 PDF 都保存在当前浏览器中，刷新和重启后仍会保留。
            </p>
          </div>
          <div className="top-actions">
            <button className="btn" disabled={refreshingAll} onClick={refreshAllPapers}>
              {refreshingAll ? "正在刷新…" : "刷新全部资料"}
            </button>
            <button className="btn" onClick={() => exportLibrary(items)}>
              导出备份
            </button>
            <button className="btn" onClick={() => importRef.current?.click()}>
              导入备份
            </button>
            <button className="btn primary" onClick={() => openEditor(null)}>
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
        <div className="notice" style={{ marginBottom: 16 }}>JSON 备份只包含论文信息和笔记，不包含上传的 PDF 原文件；重要 PDF 请同时保留在电脑文件夹中。</div>

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
              <div className="meta">{paper.year || "年份未填"} · {paper.venue || "发表来源未填"}</div>
              <Link
                href={`/library/${paper.id}`}
                className="paper-title"
                style={{ marginTop: 8 }}
              >
                {paper.title}
              </Link>
              <div className="meta">{paper.authors.join(", ") || "作者未填"}</div>
              <p className="paper-summary">
                {paper.mySummary || paper.autoSummary || "尚未生成一句话总结。"}
              </p>
              <div className="tag-row">
                {paperKeywords(paper).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                {paper.isDemo && <span className="tag demo">演示数据</span>}
              </div>
              <div className="paper-foot">
                <span className={`status ${paper.readingStatus}`}>
                  {statusLabel[paper.readingStatus]}
                </span>
                <div>
                  {paper.attachmentName && <><button className="btn" onClick={() => openLocalFile(paper)}>打开本地 PDF</button>{" "}</>}
                  {paper.pdfUrl && <><a className="btn primary" href={paper.pdfUrl} target="_blank" rel="noreferrer">打开 PDF ↗</a>{" "}</>}
                  {paperSourceUrl(paper) && <><a className="btn" href={paperSourceUrl(paper)} target="_blank" rel="noreferrer">打开论文页面 ↗</a>{" "}</>}
                  <button className="btn" disabled={refreshingAll || refreshingIds.includes(paper.id)} onClick={() => refreshOnePaper(paper)}>
                    {refreshingIds.includes(paper.id) ? "刷新中…" : "刷新资料"}
                  </button>{" "}
                  <button className="btn" onClick={() => openEditor(paper)}>编辑</button>{" "}
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
            <form ref={editorRef} className="modal" onSubmit={save}>
              <div className="section-head">
                <h2>{editing ? "编辑论文" : "添加论文"}</h2>
                <button type="button" className="btn" onClick={() => setEditing(undefined)}>
                  关闭
                </button>
              </div>
              <div className="form-grid">
                <label className="label wide upload-box">上传本地 PDF
                  <input name="pdfFile" type="file" accept="application/pdf,.pdf" className="field" onChange={identifyPdf} />
                  <span>{editing?.attachmentName ? `当前文件：${editing.attachmentName}（选择新文件可替换）` : "PDF 将保存在这台电脑的浏览器中"}</span>
                </label>
                <div className="wide source-divider"><span>或者</span></div>
                <label className="label wide">粘贴论文链接、DOI 或标题
                  <div className="source-search-row">
                    <input name="source" className="field" defaultValue={editing?.doi || editing?.url} placeholder="https://…、10.xxxx/xxxxx 或论文标题" />
                    <button type="button" className="btn" onClick={searchFromLink} disabled={searchingMetadata}>{searchingMetadata ? "正在查询…" : "自动补全信息"}</button>
                  </div>
                </label>
                {metadataNotice && <div className="notice wide">{metadataNotice}</div>}
                {candidates.length > 0 && <div className="wide metadata-results">
                  {candidates.map((candidate) => <button type="button" key={candidate.id} className={`metadata-candidate ${metadata?.id === candidate.id ? "selected" : ""}`} onClick={() => setMetadata(candidate)}>
                    <strong>{candidate.title}</strong>
                    <span>{candidate.authors.slice(0, 3).join("、") || "作者未知"} · {candidate.year || "年份未知"} · {candidate.venue || "来源未知"}</span>
                  </button>)}
                </div>}
                {metadata && <div className="notice wide">将自动填写：{metadata.title}；{metadata.authors.join("、") || "作者未知"}；{metadata.year || "年份未知"}；{metadata.venue || "来源未知"}{metadata.doi ? `；DOI ${metadata.doi}` : ""}{metadata.keywords?.length ? `；${metadata.keywords.length} 个关键词` : "；未获取到关键词"}{metadata.summary ? "；已生成一句话总结" : "；未获取到摘要"}{metadata.pdfUrl ? "；已找到开放 PDF" : "；暂未找到开放 PDF"}</div>}
                <details className="wide optional-fields">
                  <summary>补充论文信息（全部可选）</summary>
                  <div className="form-grid" style={{ marginTop: 14 }}>
                    <label className="label wide">论文标题<input name="title" className="field" defaultValue={editing?.title} placeholder="不填则使用 PDF 文件名或链接末尾" /></label>
                    <label className="label wide">作者<input name="authors" className="field" defaultValue={editing?.authors.join(", ")} placeholder="多位作者用逗号分隔" /></label>
                    <label className="label">年份<input name="year" type="number" className="field" defaultValue={editing?.year} /></label>
                    <label className="label">阅读状态<select name="status" className="field" defaultValue={editing?.readingStatus ?? "to_read"}><option value="to_read">待读</option><option value="reading">阅读中</option><option value="read">已读</option></select></label>
                    <label className="label wide">标签（逗号分隔）<input name="tags" className="field" defaultValue={editing?.tags.join(", ")} /></label>
                    <label className="label wide">一句话总结<textarea name="summary" className="field" defaultValue={editing?.mySummary} /></label>
                    <label className="label wide">发表来源<input name="venue" className="field" defaultValue={editing?.venue} placeholder="期刊、会议或预印本平台" /></label>
                    <label className="label wide">研究问题<textarea name="researchQuestion" className="field" defaultValue={editing?.researchQuestion} /></label>
                    <label className="label wide">方法概述<textarea name="methodSummary" className="field" defaultValue={editing?.methodSummary} /></label>
                    <label className="label wide">我的笔记<textarea name="notes" className="field" defaultValue={editing?.myNotes} /></label>
                  </div>
                </details>
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
