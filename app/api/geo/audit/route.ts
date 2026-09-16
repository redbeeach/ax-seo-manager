import { NextRequest, NextResponse } from "next/server";

type AuditStatus = "good" | "warn" | "bad";

interface AuditItem {
  label: string;
  value: string;
  passed: boolean;
  status: AuditStatus;
  points: number;
}

interface AuditCategory {
  key: string;
  title: string;
  description: string;
  score: number;
  items: AuditItem[];
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTagContent(html: string, selector: "description" | "robots" | "og:title" | "og:description"): string | null {
  const attr = selector.startsWith("og:") ? "property" : "name";
  const escaped = selector.replace(":", "\\:");
  const regex = new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${escaped}["'][^>]*>`, "i");
  const match = html.match(regex);
  return match ? (match[1] || match[2] || "").trim() : null;
}

function getTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : null;
}

function countTag(html: string, tag: string): number {
  const matches = html.match(new RegExp(`<${tag}[\\s>]`, "gi"));
  return matches ? matches.length : 0;
}

function countMatches(html: string, regex: RegExp): number {
  return html.match(regex)?.length ?? 0;
}

function getCanonical(html: string): string | null {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>|<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return match ? (match[1] || match[2] || "").trim() : null;
}

function getImageStats(html: string): { total: number; missingAlt: number } {
  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  const missingAlt = images.filter((tag) => {
    const alt = tag.match(/alt\s*=\s*["']([^"']*)["']/i);
    return !alt || alt[1].trim().length === 0;
  }).length;
  return { total: images.length, missingAlt };
}

function getLinkStats(html: string, hostname: string): { internal: number; external: number } {
  const anchors = html.match(/<a\b[^>]*href\s*=\s*["'][^"']*["'][^>]*>/gi) ?? [];
  let internal = 0;
  let external = 0;

  for (const tag of anchors) {
    const href = tag.match(/href\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    try {
      const parsed = href.startsWith("http") ? new URL(href) : null;
      if (parsed && parsed.hostname !== hostname) external += 1;
      else internal += 1;
    } catch {
      internal += 1;
    }
  }

  return { internal, external };
}

function normalizeUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("http 또는 https 주소만 진단할 수 있습니다.");
  }

  const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  if (blockedHosts.includes(url.hostname) || url.hostname.endsWith(".local")) {
    throw new Error("공개 웹사이트 주소를 입력해 주세요.");
  }

  return url;
}

function item(label: string, passed: boolean, value: string, points: number): AuditItem {
  return {
    label,
    value,
    passed,
    status: passed ? "good" : points > 0 ? "warn" : "bad",
    points,
  };
}

function category(key: string, title: string, description: string, items: AuditItem[]): AuditCategory {
  const score = Math.round(items.reduce((sum, current) => sum + current.points, 0));
  return { key, title, description, score, items };
}

function buildConnectionFailedResult(targetUrl: URL, message: string, elapsedMs: number) {
  const categories = [
    category("crawl", "크롤링·색인 접근성", "진단 서버가 대상 홈페이지에 접근할 수 있는지 확인합니다.", [
      item("외부 접속", false, "진단 서버에서 대상 URL에 연결하지 못했습니다.", 0),
      item("입력 URL 형식", true, "URL 형식은 정상입니다.", 25),
      item("네트워크 상태", false, message, 0),
    ]),
    category("meta", "검색 기술·메타정보", "페이지 HTML을 가져와야 제목과 설명을 확인할 수 있습니다.", [
      item("Title", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("Description", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("Open Graph", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("Canonical", false, "페이지를 가져오지 못해 확인 불가", 0),
    ]),
    category("schema", "구조화 데이터", "JSON-LD와 Schema.org 적용 여부를 확인합니다.", [
      item("JSON-LD", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("FAQ 신호", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("조직/웹사이트 신호", false, "페이지를 가져오지 못해 확인 불가", 0),
    ]),
    category("content", "콘텐츠 적합성·답변 활용성", "본문 분량과 답변형 콘텐츠 구조를 확인합니다.", [
      item("본문 분량", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("질문형 콘텐츠", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("표/리스트", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("외부 출처", false, "페이지를 가져오지 못해 확인 불가", 0),
    ]),
    category("structure", "정보 구조·내부 연결성", "헤딩 계층과 내부 링크를 확인합니다.", [
      item("H1", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("H2/H3", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("내부 링크", false, "페이지를 가져오지 못해 확인 불가", 0),
    ]),
    category("trust", "브랜드·엔티티·신뢰 신호", "운영 주체와 언어 선언을 확인합니다.", [
      item("회사/문의 신호", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("HTML lang", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("브랜드명 반복", false, "페이지를 가져오지 못해 확인 불가", 0),
    ]),
    category("media", "이미지·미디어 이해도", "이미지 대체 텍스트를 확인합니다.", [
      item("이미지 ALT", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("미디어 규모", false, "페이지를 가져오지 못해 확인 불가", 0),
    ]),
    category("experience", "페이지 경험·성능", "모바일 대응과 HTML 크기를 확인합니다.", [
      item("모바일 viewport", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("HTML 크기", false, "페이지를 가져오지 못해 확인 불가", 0),
      item("스크립트 수", false, "페이지를 가져오지 못해 확인 불가", 0),
    ]),
  ];

  return {
    url: targetUrl.toString(),
    finalUrl: targetUrl.toString(),
    checkedAt: new Date().toISOString(),
    elapsedMs,
    overall: 3,
    grade: "F",
    summary: {
      title: "대상 사이트 접속 실패",
      description: "입력한 URL 형식은 맞지만, 진단 서버가 외부 페이지 HTML을 가져오지 못했습니다.",
      h1Count: 0,
      h2Count: 0,
      imageCount: 0,
      missingAlt: 0,
      internal: 0,
      external: 0,
      schemaCount: 0,
      charCount: 0,
    },
    categories,
    recommendations: [
      {
        category: "진단 환경",
        label: "서버 외부 네트워크 확인",
        message: "현재 dev 서버 환경에서 외부 URL 접속이 차단되어 있습니다.",
      },
      {
        category: "배포 환경",
        label: "호스팅 환경에서 재진단",
        message: "Vercel, Cafe24, 운영 서버처럼 외부 fetch가 가능한 환경에서 다시 실행해 주세요.",
      },
      {
        category: "대상 URL",
        label: "방화벽·봇 차단 확인",
        message: "대상 사이트가 서버 요청이나 봇 User-Agent를 차단하는지도 확인이 필요합니다.",
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url: rawUrl } = (await request.json()) as { url?: string };

    if (!rawUrl) {
      return NextResponse.json({ error: "진단할 사이트 주소를 입력해 주세요." }, { status: 400 });
    }

    const targetUrl = normalizeUrl(rawUrl);
    const startedAt = Date.now();
    let response: Response;

    try {
      response = await fetch(targetUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (compatible; AX SEO Manager GEO Audit Bot/1.0; +https://localhost)",
        },
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      const message =
        error instanceof Error && error.message !== "fetch failed"
          ? error.message
          : "외부 네트워크 연결이 차단되었거나 대상 서버가 요청을 거부했습니다.";

      return NextResponse.json(buildConnectionFailedResult(targetUrl, message, elapsedMs));
    }

    const elapsedMs = Date.now() - startedAt;
    const html = await response.text();
    const plainText = stripTags(html);
    const title = getTitle(html);
    const description = getTagContent(html, "description");
    const robots = getTagContent(html, "robots");
    const canonical = getCanonical(html);
    const ogTitle = getTagContent(html, "og:title");
    const ogDescription = getTagContent(html, "og:description");
    const h1Count = countTag(html, "h1");
    const h2Count = countTag(html, "h2");
    const h3Count = countTag(html, "h3");
    const schemaCount = countMatches(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi);
    const faqSignals = countMatches(html, /FAQ|자주 묻는 질문|질문|답변|Q\.|schema\.org\/FAQPage/gi);
    const listCount = countTag(html, "ul") + countTag(html, "ol");
    const tableCount = countTag(html, "table");
    const scriptCount = countTag(html, "script");
    const { total: imageCount, missingAlt } = getImageStats(html);
    const { internal, external } = getLinkStats(html, targetUrl.hostname);
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const hasLang = /<html[^>]+lang=["'][^"']+["']/i.test(html);
    const hasContactSignal = /회사|대표|주소|연락처|전화|문의|about|contact|email|tel:/i.test(plainText + html);
    const hasNoIndex = robots ? /noindex|none/i.test(robots) : false;
    const htmlKb = Math.round(Buffer.byteLength(html, "utf8") / 1024);

    const categories = [
      category("crawl", "크롤링·색인 접근성", "AI 검색 크롤러가 페이지를 수집할 수 있는지 확인합니다.", [
        item("HTTP 응답", response.ok, response.ok ? `정상 응답 ${response.status}` : `응답 오류 ${response.status}`, response.ok ? 35 : 0),
        item("색인 허용", !hasNoIndex, hasNoIndex ? "robots noindex 감지" : "noindex 없음", hasNoIndex ? 0 : 30),
        item("HTML 수집", plainText.length > 200, `${plainText.length.toLocaleString()}자 수집`, plainText.length > 200 ? 35 : 10),
      ]),
      category("meta", "검색 기술·메타정보", "제목, 설명, 공유 메타, 대표 URL이 명확한지 봅니다.", [
        item("Title", !!title && title.length <= 70, title ? `${title.length}자` : "없음", title ? (title.length <= 70 ? 25 : 15) : 0),
        item("Description", !!description && description.length <= 170, description ? `${description.length}자` : "없음", description ? (description.length <= 170 ? 25 : 15) : 0),
        item("Open Graph", !!ogTitle && !!ogDescription, ogTitle && ogDescription ? "OG 제목/설명 있음" : "OG 정보 부족", ogTitle && ogDescription ? 25 : 8),
        item("Canonical", !!canonical, canonical ? "대표 URL 있음" : "대표 URL 없음", canonical ? 25 : 0),
      ]),
      category("schema", "구조화 데이터", "Schema.org JSON-LD로 AI가 의미를 이해하기 쉬운지 확인합니다.", [
        item("JSON-LD", schemaCount > 0, `${schemaCount}개 발견`, schemaCount > 0 ? 45 : 0),
        item("FAQ 신호", faqSignals >= 3, `${faqSignals}개 발견`, faqSignals >= 3 ? 30 : faqSignals > 0 ? 12 : 0),
        item("조직/웹사이트 신호", /Organization|WebSite|LocalBusiness|Article|BreadcrumbList/i.test(html), "Schema 타입 검사", /Organization|WebSite|LocalBusiness|Article|BreadcrumbList/i.test(html) ? 25 : 0),
      ]),
      category("content", "콘텐츠 적합성·답변 활용성", "본문이 AI 답변 재료로 쓰이기 충분한지 계산합니다.", [
        item("본문 분량", plainText.length >= 1000, `${plainText.length.toLocaleString()}자`, plainText.length >= 1000 ? 30 : plainText.length >= 500 ? 16 : 5),
        item("질문형 콘텐츠", faqSignals >= 3, `${faqSignals}개 신호`, faqSignals >= 3 ? 25 : faqSignals > 0 ? 10 : 0),
        item("표/리스트", tableCount + listCount > 0, `표 ${tableCount}개, 리스트 ${listCount}개`, tableCount + listCount > 0 ? 25 : 0),
        item("외부 출처", external > 0, `외부 링크 ${external}개`, external > 0 ? 20 : 0),
      ]),
      category("structure", "정보 구조·내부 연결성", "헤딩 계층과 내부 링크가 명확한지 확인합니다.", [
        item("H1", h1Count === 1, `${h1Count}개`, h1Count === 1 ? 30 : h1Count > 0 ? 12 : 0),
        item("H2/H3", h2Count + h3Count >= 3, `H2 ${h2Count}개, H3 ${h3Count}개`, h2Count + h3Count >= 3 ? 35 : 12),
        item("내부 링크", internal >= 3, `${internal}개`, internal >= 3 ? 35 : internal > 0 ? 15 : 0),
      ]),
      category("trust", "브랜드·엔티티·신뢰 신호", "운영 주체와 연락 가능한 정보가 드러나는지 봅니다.", [
        item("회사/문의 신호", hasContactSignal, hasContactSignal ? "브랜드 신뢰 정보 감지" : "신뢰 정보 부족", hasContactSignal ? 40 : 0),
        item("HTML lang", hasLang, hasLang ? "언어 선언 있음" : "언어 선언 없음", hasLang ? 25 : 0),
        item("브랜드명 반복", !!title && plainText.includes(title.split(/\s+/)[0]), "제목 키워드 본문 연계", title && plainText.includes(title.split(/\s+/)[0]) ? 35 : 10),
      ]),
      category("media", "이미지·미디어 이해도", "이미지 대체 텍스트가 충분한지 확인합니다.", [
        item("이미지 ALT", imageCount === 0 || missingAlt === 0, imageCount === 0 ? "이미지 없음" : `${missingAlt}/${imageCount}개 누락`, imageCount === 0 || missingAlt === 0 ? 70 : Math.max(0, 70 - missingAlt * 15)),
        item("미디어 규모", imageCount <= 40, `${imageCount}개 이미지`, imageCount <= 40 ? 30 : 12),
      ]),
      category("experience", "페이지 경험·성능", "모바일 기본 대응과 HTML 무게를 빠르게 점검합니다.", [
        item("모바일 viewport", hasViewport, hasViewport ? "viewport 있음" : "viewport 없음", hasViewport ? 35 : 0),
        item("HTML 크기", htmlKb <= 800, `${htmlKb}KB`, htmlKb <= 800 ? 35 : htmlKb <= 1500 ? 18 : 5),
        item("스크립트 수", scriptCount <= 35, `${scriptCount}개`, scriptCount <= 35 ? 30 : 10),
      ]),
    ];

    const overall = Math.round(categories.reduce((sum, current) => sum + current.score, 0) / categories.length);
    const failedItems = categories.flatMap((current) =>
      current.items
        .filter((entry) => !entry.passed)
        .map((entry) => ({
          category: current.title,
          label: entry.label,
          message: entry.value,
        })),
    );

    return NextResponse.json({
      url: targetUrl.toString(),
      finalUrl: response.url,
      checkedAt: new Date().toISOString(),
      elapsedMs,
      overall,
      grade: overall >= 90 ? "A+" : overall >= 80 ? "A" : overall >= 70 ? "B" : overall >= 60 ? "C" : overall >= 50 ? "D" : "F",
      summary: {
        title,
        description,
        h1Count,
        h2Count,
        imageCount,
        missingAlt,
        internal,
        external,
        schemaCount,
        charCount: plainText.length,
      },
      categories,
      recommendations: failedItems.slice(0, 8),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "GEO 진단 중 오류가 발생했습니다." },
      { status: 400 },
    );
  }
}
