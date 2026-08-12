"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { edges, nodes, paperById } from "@/lib/demo-data";
import { loadLocalPapers, updateLocalPaper } from "@/lib/local-library";
import { getPaperFileUrl } from "@/lib/local-files";
import { paperSourceUrl } from "@/lib/paper-link";
import type { Paper } from "@/lib/types";
import { createdByLabel, relationTypeLabel } from "@/lib/ui-labels";
import { AppShell } from "./app-shell";

export function PaperDetail({ id }: { id: string }) {
  const [paper, setPaper] = useState<Paper | undefined>(() => paperById(id));
  const [note, setNote] = useState(paper?.myNotes ?? "");
  const [saved, setSaved] = useState(false);

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
            {paperSourceUrl(paper) && <a className="btn primary" href={paperSourceUrl(paper)} target="_blank" rel="noreferrer">打开论文原文 ↗</a>}
            <span className={`status ${paper.readingStatus}`}>{paper.readingStatus === "read" ? "已读" : paper.readingStatus === "reading" ? "阅读中" : "待读"}</span>
          </div>
        </div>
        <div className="detail-layout">
          <div className="card">
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
            </div>
            <div className="tag-row">
              {paper.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              {paper.isDemo && <span className="tag demo">演示数据</span>}
            </div>
            <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "18px 0" }} />
            <span className="eyebrow">我的总结</span>
            <p className="subtle" style={{ marginTop: 10 }}>{paper.mySummary}</p>
            <Link href="/graph" className="btn" style={{ width: "100%" }}>在图谱中查看</Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, text }: { title: string; text?: string }) {
  return <section className="detail-section"><h2>{title}</h2><p>{text || "尚未整理。"}</p></section>;
}

function KV({ k, v }: { k: string; v: unknown }) {
  return <div className="kv"><span>{k}</span><span>{String(v ?? "—")}</span></div>;
}
