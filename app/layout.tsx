import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ResearchGraph 科研知识图谱 — 个人 AI 科研知识管理系统",
    template: "%s · ResearchGraph 科研知识图谱",
  },
  description: "把论文、笔记和研究构想整理成有证据支撑的个人科研知识图谱。",
  metadataBase: new URL("https://researchgraph.local"),
  openGraph: {
    title: "ResearchGraph 科研知识图谱",
    description: "个人 AI 科研知识管理系统",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "科研知识图谱" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResearchGraph 科研知识图谱",
    description: "个人 AI 科研知识管理系统",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
