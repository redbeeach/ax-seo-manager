import type { Metadata } from "next";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://ax-seo-manager.vercel.app",
);
export const siteTitle = "AX SEO Manager - AI 검색 최적화 솔루션";
export const siteDescription =
  "그누보드5 콘텐츠의 SEO, AEO, GEO를 분석하고 AI 최적화부터 메타태그 적용, 실제 페이지 검증까지 관리하세요. 사이트 무료 진단도 제공합니다.";

export function publicPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: new URL(path, siteUrl).href },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: "AX SEO Manager",
      title,
      description,
      url: new URL(path, siteUrl).href,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AX SEO Manager" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}
