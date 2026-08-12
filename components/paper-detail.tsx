"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { edges, nodes, paperById } from "@/lib/demo-data";
import { loadLocalPapers, updateLocalPaper } from "@/lib/local-library";
import type { Paper } from "@/lib/types";
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
      <AppShell section="Paper Detail">
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

  return (
    <AppShell section="Paper Detail">
      <div className="content">
        <div className="page-head">
          <div>
            <Link href="/library" className="meta">← Literature Library</Link>
            <h1 style={{ maxWidth: 850, marginTop: 14 }}>{paper.title}</h1>
            <p className="subtle">{paper.authors.join(", ")}</p>
          </div>
          <span className={`status ${paper.readingStatus}`}>{paper.readingStatus}</span>
        </div>
        <div className="detail-layout">
          <div className="card">
            <Section title="Research Question" text={paper.researchQuestion} />
            <Section title="Method" text={paper.methodSummary} />
            <Section title="Dataset" text={paper.dataSummary} />
            <Section title="Contributions" text={paper.mainContributions} />
            <Section title="Results" text={paper.mainResults} />
            <Section title="Limitations" text={paper.limitations} />
            <Section title="Future Work" text={paper.futureWork} />
            <section className="detail-section">
              <h2>My Notes</h2>
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
              <h2>Inspiration</h2>
              <div className="note-box">{paper.inspiration || "尚未记录灵感。"}</div>
            </section>
            <section className="detail-section">
              <h2>Graph Relations</h2>
              {relations.length ? relations.map((relation) => (
                <div className="list-row" key={relation.id}>
                  <div><strong>{relation.relationType}</strong><div className="meta">{relation.evidence}</div></div>
                  <span className="tag">{relation.createdBy} · {Math.round(relation.confidence * 100)}%</span>
                </div>
              )) : <p>尚无图关系。</p>}
            </section>
          </div>
          <aside className="card side-card">
            <span className="eyebrow">Metadata</span>
            <div style={{ marginTop: 12 }}>
              <KV k="Year" v={paper.year} />
              <KV k="Venue" v={paper.venue} />
              <KV k="DOI" v={paper.doi || "—"} />
              <KV k="Rating" v={paper.rating ? "★".repeat(paper.rating) : "—"} />
              <KV k="Updated" v={paper.updatedAt} />
            </div>
            <div className="tag-row">
              {paper.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              {paper.isDemo && <span className="tag demo">DEMO DATA</span>}
            </div>
            <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "18px 0" }} />
            <span className="eyebrow">My Summary</span>
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
