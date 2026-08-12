"use client";

import {
  type FormEvent,
  type PointerEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { edges as demoEdges, nodes as demoNodes } from "@/lib/demo-data";
import type {
  CreatedBy,
  GraphEdge,
  NodeType,
  RelationType,
} from "@/lib/types";
import { AppShell } from "./app-shell";

const positions: Record<string, [number, number]> = {
  "p-cbm": [20, 20],
  "p-nscr": [72, 17],
  "m-cbm": [38, 38],
  "m-ns": [72, 41],
  "pr-explain": [18, 62],
  "pr-eddy": [73, 70],
  "c-concept": [46, 67],
  "c-physics": [89, 52],
  "d-ocean": [50, 88],
  "i-ocean": [87, 88],
};

const nodeTypes: NodeType[] = [
  "Paper",
  "Method",
  "Problem",
  "Concept",
  "Dataset",
  "ResearchIdea",
];

const relationTypes: RelationType[] = [
  "USES",
  "STUDIES",
  "USES_CONCEPT",
  "USES_DATASET",
  "HAS_LIMITATION",
  "SOLVES",
  "EXTENDS",
  "SUPPORTS",
  "CONTRADICTS",
  "RELATED_TO",
];

export function KnowledgeGraph() {
  const [allEdges, setAllEdges] = useState(demoEdges);
  const [enabled, setEnabled] = useState<Set<NodeType>>(new Set(nodeTypes));
  const [query, setQuery] = useState("");
  const [relationFilter, setRelationFilter] = useState<"all" | RelationType>(
    "all",
  );
  const [selected, setSelected] = useState(demoNodes[0]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [adding, setAdding] = useState(false);
  const drag = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  const visibleNodes = useMemo(
    () =>
      demoNodes.filter(
        (node) =>
          enabled.has(node.type) &&
          node.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [enabled, query],
  );
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = allEdges.filter(
    (edge) =>
      visibleIds.has(edge.source) &&
      visibleIds.has(edge.target) &&
      (relationFilter === "all" || edge.relationType === relationFilter),
  );

  const toggleNodeType = (type: NodeType) => {
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPan({
      x: drag.current.panX + event.clientX - drag.current.x,
      y: drag.current.panY + event.clientY - drag.current.y,
    });
  };

  const stopDragging = () => {
    drag.current = null;
  };

  const addEdge = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAllEdges((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        source: String(form.get("source")),
        target: String(form.get("target")),
        relationType: String(form.get("relation")) as RelationType,
        confidence: Number(form.get("confidence")),
        evidence: String(form.get("evidence")),
        createdBy: String(form.get("createdBy")) as CreatedBy,
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setAdding(false);
  };

  return (
    <AppShell section="Knowledge Graph">
      <div className="content">
        <div className="page-head">
          <div>
            <h1>Knowledge Graph</h1>
            <p className="subtle">
              从“谁引用谁”继续深入：论文如何使用方法、研究问题、依赖概念，以及支持你的研究构想。
            </p>
          </div>
          <button className="btn primary" onClick={() => setAdding(true)}>
            ＋ 建立关系
          </button>
        </div>

        <div className="section-head">
          <div className="filters">
            {nodeTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleNodeType(type)}
                className={`filter-chip ${enabled.has(type) ? "on" : ""}`}
              >
                {type}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="field"
              style={{ maxWidth: 190 }}
              value={relationFilter}
              onChange={(event) =>
                setRelationFilter(event.target.value as "all" | RelationType)
              }
              aria-label="关系类型"
            >
              <option value="all">全部关系</option>
              {relationTypes.map((relation) => (
                <option key={relation} value={relation}>
                  {relation}
                </option>
              ))}
            </select>
            <input
              className="field"
              style={{ maxWidth: 270 }}
              placeholder="搜索节点…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="graph-layout">
          <div
            className="graph-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            <div className="graph-tools">
              <button
                className="btn"
                onClick={() => setZoom((current) => Math.min(1.5, current + 0.1))}
              >
                ＋
              </button>
              <button
                className="btn"
                onClick={() => setZoom((current) => Math.max(0.7, current - 0.1))}
              >
                −
              </button>
              <button
                className="btn"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                Reset
              </button>
            </div>
            <div
              className="graph-stage"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {visibleEdges.map((edge) => (
                <Edge key={edge.id} edge={edge} />
              ))}
              {visibleNodes.map((node) => (
                <button
                  key={node.id}
                  className={`node ${node.type}`}
                  style={{
                    left: `${positions[node.id]?.[0] ?? 50}%`,
                    top: `${positions[node.id]?.[1] ?? 50}%`,
                  }}
                  onClick={() => setSelected(node)}
                >
                  <small>{node.type}</small>
                  {node.label}
                </button>
              ))}
            </div>
          </div>

          <aside className="card">
            <span className="eyebrow">Selected node</span>
            <h2 style={{ marginTop: 12 }}>{selected.label}</h2>
            <span className="tag">{selected.type}</span>
            <p className="subtle" style={{ marginTop: 16 }}>
              {selected.description ||
                "该节点由演示知识图谱提供。点击其他节点查看关联信息。"}
            </p>
            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--line)",
                margin: "18px 0",
              }}
            />
            <span className="eyebrow">Relations</span>
            <div className="list">
              {allEdges
                .filter(
                  (edge) =>
                    edge.source === selected.id || edge.target === selected.id,
                )
                .map((edge) => (
                  <div className="list-row" key={edge.id}>
                    <div>
                      <strong style={{ fontSize: 11 }}>
                        {edge.relationType}
                      </strong>
                      <div className="meta">{edge.evidence}</div>
                    </div>
                    <span className="tag">{edge.createdBy}</span>
                  </div>
                ))}
            </div>
          </aside>
        </div>

        {adding && (
          <div className="modal-backdrop">
            <form className="modal" onSubmit={addEdge}>
              <div className="section-head">
                <h2>手动建立图关系</h2>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setAdding(false)}
                >
                  关闭
                </button>
              </div>
              <div className="form-grid">
                <label className="label">
                  Source
                  <select className="field" name="source">
                    {demoNodes.map((node) => (
                      <option value={node.id} key={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Target
                  <select className="field" name="target">
                    {demoNodes.map((node) => (
                      <option value={node.id} key={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Relation
                  <select className="field" name="relation">
                    {relationTypes.map((relation) => (
                      <option key={relation}>{relation}</option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Created by
                  <select className="field" name="createdBy">
                    <option>user</option>
                    <option>ai</option>
                    <option>import</option>
                  </select>
                </label>
                <label className="label wide">
                  Evidence
                  <textarea
                    required
                    className="field"
                    name="evidence"
                    placeholder="这条关系由哪篇论文、哪条笔记或哪段文本支持？"
                  />
                </label>
                <label className="label wide">
                  Confidence
                  <input
                    className="field"
                    name="confidence"
                    type="number"
                    min="0"
                    max="1"
                    step=".05"
                    defaultValue="1"
                  />
                </label>
              </div>
              <button className="btn primary" style={{ marginTop: 16 }}>
                保存关系
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Edge({ edge }: { edge: GraphEdge }) {
  const source = positions[edge.source] ?? [50, 50];
  const target = positions[edge.target] ?? [50, 50];
  const deltaX = target[0] - source[0];
  const deltaY = target[1] - source[1];
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

  return (
    <div
      className="edge"
      style={{
        left: `${source[0]}%`,
        top: `${source[1]}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <span className="edge-label">{edge.relationType}</span>
    </div>
  );
}
