import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AX SEO Manager — 그누보드5 AI 검색 최적화 솔루션",
  description:
    "그누보드5 게시글을 SEO, AEO, GEO, JSON-LD 초안으로 자동 최적화하는 AI 검색 최적화 솔루션입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
