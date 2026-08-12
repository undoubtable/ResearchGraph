"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { edges, nodes, paperById } from "@/lib/demo-data";
import { loadLocalPapers, updateLocalPaper } from "@/lib/local-library";
import { getPaperFile, getPaperFileUrl } from "@/lib/local-files";
import { analyzePaperText, extractPdfText, fillMissingPaperAnalysis } from "@/lib/paper-analysis";
import { paperSourceUrl } from "@/lib/paper-link";
import type { Paper } from "@/lib/types";
import { createdByLabel, relationTypeLabel } from "@/lib/ui-labels";
import { AppShell } from "./app-shell";

export function PaperDetail({ id }: { id: string }) {
  const [paper, setPaper] = useState<Paper | undefined>(() => paperById(id));
  const [note, setNote] = useState(paper?.myNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const localPaper = loadLocalPapers().find((item) => item.id === id);
      setPaper(localPaper);
      setNote(localPaper?.myNotes ?? "");
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (!paper) {
    return (
      <AppShell section="论文详情">
        <div className="content">
          <h1>未找到论文</h1>
          <Link className="btn" href="/library">返回文献库</Link>
        </div>
      </AppShell>
    );
  }

  const paperNode = nodes.find((node) => node.paperId === id);
  const relations = edges.filter(
    (edge) => paperNode && (edge.source === paperNode.id || edge.target === paperNode.id),
  );

  const saveNote = () => {
    const updated = updateLocalPaper(id, { myNotes: note });
    if (updated) setPaper(updated);
    setSaved(true);
  };

  const openLocalFile = async () => {
    const tab = window.open("about:blank", "_blank");
    const fileUrl = await getPaperFileUrl(id);
    if (fileUrl && tab) {
      tab.location.href = fileUrl;
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } else {
      tab?.close();
      window.alert("没有找到这篇论文的本地文件，请返回文献库重新上传。 ");
    }
  };

  const analyzeContent = async () => {
    setAnalyzing(true);
    setAnalysisNotice(paper.attachmentName ? "正在本地读取 PDF 并整理内容…" : "正在根据摘要整理内容…");
    try {
      const localFile = paper.attachmentName ? await getPaperFile(id) : undefined;
      const sourceText = localFile ? await extractPdfText(localFile) : paper.abstract || "";
      if (!sourceText) {
        setAnalysisNotice("目前没有本地 PDF 或公开摘要。请先返回文献库上传 PDF，或刷新论文资料。 ");
        return;
      }
      const filled = fillMissingPaperAnalysis(paper, analyzePaperText(sourceText));
      const count = Object.keys(filled).length;
      if (!count) {
        setAnalysisNotice("没有发现可可靠提取的新内容；已有手工内容不会被覆盖。 ");
        return;
      }
      const updated = updateLocalPaper(id, {
        ...filled,
        analysisSource: localFile ? "local_pdf" : "abstract",
        analysisUpdatedAt: new Date().toISOString(),
      });
      if (updated) setPaper(updated);
      setAnalysisNotice(`已自动补全 ${count} 项；请结合原文复核，手工内容没有被覆盖。`);
    } catch {
      setAnalysisNotice("论文内容分析失败；PDF 可能是扫描图片，或文件暂时无法读取。 ");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppShell section="论文详情">
      <div className="content">
        <div className="page-head">
          <div>
            <Link href="/library" className="meta">← 返回文献库</Link>
            <h1 style={{ maxWidth: 850, marginTop: 14 }}>{paper.title}</h1>
            <p className="subtle">{paper.authors.join(", ")}</p>
          </div>
          <div className="top-actions">
            {paper.attachmentName && <button className="btn primary" onClick={openLocalFile}>打开本地 PDF</button>}
            {paper.pdfUrl && <a className="btn primary" href={paper.pdfUrl} target="_blank" rel="noreferrer">打开 PDF ↗</a>}
            {paperSourceUrl(paper) && <a className="btn" href={paperSourceUrl(paper)} target="_blank" rel="noreferrer">打开论文页面 ↗</a>}
            <span className={`status ${paper.readingStatus}`}>{paper.readingStatus === "read" ? "已读" : paper.readingStatus === "reading" ? "阅读中" : "待读"}</span>
          </div>
        </div>
        {analysisNotice && <div className="notice" style={{ marginBottom: 16 }}>{analysisNotice}</div>}
        <div className="detail-layout">
          <div className="card">
            <section className="analysis-callout">
              <div>
                <span className="eyebrow">论文内容自动整理</span>
                <p>自动补全研究问题、方法、数据集、贡献、结果、局限和未来工作，不覆盖你已经修改的内容。</p>
              </div>
              <button className="btn primary" disabled={analyzing} onClick={analyzeContent}>
                {analyzing ? "正在分析…" : paper.attachmentName ? "分析本地 PDF" : "根据摘要自动填写"}
              </button>
            </section>
            <Section title="研究问题" text={paper.researchQuestion} />
            <Section title="研究方法" text={paper.methodSummary} />
            <Section title="数据集" text={paper.dataSummary} />
            <Section title="主要贡献" text={paper.mainContributions} />
            <Section title="主要结果" text={paper.mainResults} />
            <Section title="局限性" text={paper.limitations} />
            <Section title="未来工作" text={paper.futureWork} />
            <section className="detail-section">
              <h2>我的笔记</h2>
              <textarea
                className="field"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setSaved(false);
                }}
              />
              <button className="btn primary" style={{ marginTop: 10 }} onClick={saveNote}>
                {saved ? "已保存到本地" : "保存笔记"}
              </button>
            </section>
            <section className="detail-section">
              <h2>研究灵感</h2>
              <div className="note-box">{paper.inspiration || "尚未记录灵感。"}</div>
            </section>
            <section className="detail-section">
              <h2>图谱关系</h2>
              {relations.length ? relations.map((relation) => (
                <div className="list-row" key={relation.id}>
                  <div><strong>{relationTypeLabel[relation.relationType]}</strong><div className="meta">{relation.evidence}</div></div>
                  <span className="tag">{createdByLabel[relation.createdBy]} · {Math.round(relation.confidence * 100)}%</span>
                </div>
              )) : <p>尚无图关系。</p>}
            </section>
          </div>
          <aside className="card side-card">
            <span className="eyebrow">书目信息</span>
            <div style={{ marginTop: 12 }}>
              <KV k="年份" v={paper.year} />
              <KV k="发表来源" v={paper.venue} />
              <KV k="DOI" v={paper.doi || "—"} />
              <KV k="评分" v={paper.rating ? "★".repeat(paper.rating) : "—"} />
              <KV k="更新时间" v={paper.updatedAt} />
              <KV k="内容分析" v={paper.analysisSource === "local_pdf" ? "来自本地 PDF" : paper.analysisSource === "abstract" ? "来自公开摘要" : "尚未分析"} />
            </div>
            <div className="tag-row">
              {[...new Set([...(paper.autoKeywords ?? []), ...paper.tags])].map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              {paper.isDemo && <span className="tag demo">演示数据</span>}
            </div>
            <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "18px 0" }} />
            <span className="eyebrow">自动摘要</span>
            <p className="subtle" style={{ marginTop: 10 }}>{paper.autoSummary || "刷新论文资料后可自动生成。"}</p>
            {paper.mySummary && <><span className="eyebrow">我的总结</span><p className="subtle" style={{ marginTop: 10 }}>{paper.mySummary}</p></>}
            <Link href="/graph" className="btn" style={{ width: "100%" }}>在图谱中查看</Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, text }: { title: string; text?: string }) {
  return <section className="detail-section"><h2>{title}</h2><p>{text || "尚未自动提取；可点击页面上方的内容分析按钮。"}</p></section>;
}

function KV({ k, v }: { k: string; v: unknown }) {
  return <div className="kv"><span>{k}</span><span>{String(v ?? "—")}</span></div>;
}
