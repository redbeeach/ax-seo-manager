import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, siteTitle, siteDescription } from "@/lib/site-metadata";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: siteTitle,
  description: siteDescription,
  applicationName: "AX SEO Manager",
  authors: [{ name: "AX SEO Manager" }],
  creator: "AX SEO Manager",
  keywords: ["SEO", "AEO", "GEO", "그누보드5", "AI 검색 최적화", "메타태그", "사이트 진단"],
  robots: { index: true, follow: true },
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
