"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [["/","01","Dashboard"],["/library","02","Literature"],["/graph","03","Knowledge Graph"],["/research","04","My Research"],["/agent","05","Research Agent"]] as const;
export function AppShell({ children, section }: { children: ReactNode; section: string }) {
  const pathname = usePathname();
  const links = nav.map(([href, icon, label]) => <Link key={href} href={href} className={pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}><span className="nav-icon">{icon}</span>{label}</Link>);
  return <div className="app-shell"><aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark">RG</span>ResearchGraph</Link><nav className="nav" aria-label="主导航">{links}</nav><div className="sidebar-foot"><p><span className="evidence-dot"/>Evidence first</p>所有 AI 判断都应回溯到论文、笔记或图关系。</div></aside><main className="main"><header className="topbar"><span className="eyebrow">{section}</span><div className="top-actions"><span className="status-pill">Local-first · Demo workspace</span></div></header>{children}</main><nav className="mobile-nav" aria-label="移动导航">{links}</nav></div>;
}
