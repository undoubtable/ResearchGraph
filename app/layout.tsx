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
    default: "ResearchGraph — Personal AI Research Knowledge System",
    template: "%s · ResearchGraph",
  },
  description: "Turn papers, notes, and research ideas into an evidence-grounded knowledge graph.",
  metadataBase: new URL("https://researchgraph.local"),
  openGraph: {
    title: "ResearchGraph",
    description: "Personal AI Research Knowledge System",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ResearchGraph knowledge graph" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResearchGraph",
    description: "Personal AI Research Knowledge System",
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
