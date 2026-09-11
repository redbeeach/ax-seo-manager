import type { ReactNode } from "react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";

const hasWorkPreview = existsSync(join(process.cwd(), "public", "work_01.webp"));

const stats = [
  ["Target Engine", "Google · ChatGPT · Perplexity", "text-white"],
  ["Automated Output", "Title · Meta · FAQ · JSON-LD", "text-indigo-400"],
  ["Analysis Method", "Live DOM + 7가지 정밀 지표", "text-emerald-400"],
  ["Integration", "그누보드5 Hook (write_update.php)", "text-white"],
];

const aiOutputs = [
  [
    "① 검색용 SEO Title & Description",
    "구글·네이버 결과창에서 잘리지 않는 최적 글자 수와 핵심 키워드 자동 배치",
  ],
  [
    "② AEO용 핵심 한 줄 답변 & FAQ 3종",
    "ChatGPT, Perplexity가 이용자의 질문에 바로 인용할 수 있는 명쾌한 질의응답 구조",
  ],
  [
    "③ GEO 생성 요약문",
    "AI 검색엔진의 합성 답변 요약(SGE)에 포함되기 좋은 전문성 있는 50자 이상 문구",
  ],
  [
    "④ Schema.org JSON-LD 구조화 데이터",
    "작성자, 발행일, 수정일, FAQPage 스키마를 포함한 검색 로봇 표준 코드 자동 생성",
  ],
];

const metrics = [
  {
    title: "01. SEO 점수 (100pt)",
    badge: "포털 검색 결과",
    badgeClass: "text-neutral-400",
    description: "검색 결과 클릭률(CTR)과 색인 허용 여부를 진단합니다.",
    points: [
      ["Title 존재 & 60자 이하", "30pt", "text-indigo-400"],
      ["Description & 155자 이하", "30pt", "text-indigo-400"],
      ["OG 태그 (Title / Desc)", "15pt", "text-indigo-400"],
      ["Canonical & robots.txt 허용", "25pt", "text-indigo-400"],
    ],
  },
  {
    title: "02. AEO 점수 (100pt)",
    badge: "답변형 AI 인용",
    badgeClass: "text-sky-400",
    description: "ChatGPT, Perplexity가 바로 인용하기 좋은 Q&A 구조인지 평가합니다.",
    points: [
      ["FAQ 질문-답변 3개 이상", "40pt", "text-sky-400"],
      ["핵심 한 줄 답변 (ae_answer)", "30pt", "text-sky-400"],
      ["Q&A 포맷 구조화", "30pt", "text-sky-400"],
    ],
  },
  {
    title: "03. GEO 점수 (100pt)",
    badge: "생성형 검색 대비",
    badgeClass: "text-emerald-400",
    description: "구글 SGE 및 생성형 AI의 답변 요약에 채택될 가능성을 측정합니다.",
    points: [
      ["JSON-LD 구조화 데이터 탑재", "40pt", "text-emerald-400"],
      ["전문 맥락 요약문 (50자 이상)", "30pt", "text-emerald-400"],
      ["GEO 엔티티 요약문 존재", "30pt", "text-emerald-400"],
    ],
  },
  {
    title: "04. Content 점수 (100pt)",
    badge: "Live 크롤링",
    badgeClass: "text-emerald-400",
    description: "실제 배포된 HTML 소스의 태그 완성도를 직접 파싱합니다.",
    points: [
      ["H1 1개 단독 마크업", "25pt", "text-indigo-400"],
      ["H2 섹션 구분 (2개 이상)", "15pt", "text-indigo-400"],
      ["이미지 ALT 속성 누락 0건", "20pt", "text-indigo-400"],
      ["내부링크(3개↑) / 본문 1000자↑", "30pt", "text-indigo-400"],
      ["표(<table>) 또는 목차 존재", "10pt", "text-indigo-400"],
    ],
  },
  {
    title: "05. AI Citation 점수 (100pt)",
    badge: "인용 신뢰성",
    badgeClass: "text-purple-400",
    description: "인공지능이 답변을 작성할 때 인용하기 쉬운 서식인지 검사합니다.",
    points: [
      ["도입부 400자 내 개념 정의문", "10pt", "text-purple-400"],
      ["비교 표(<table>) 및 리스트(<ul>)", "20pt", "text-purple-400"],
      ["외부 공신력 출처 표기 (cite)", "30pt", "text-purple-400"],
      ["FAQ 및 GEO 요약 포함", "40pt", "text-purple-400"],
    ],
  },
  {
    title: "06 & 07. E-E-A-T / 가독성",
    badge: "구글 권위성 지표",
    badgeClass: "text-amber-400",
    description: "작성자 권위성 입증 및 자연스러운 문장 호흡을 평가합니다.",
    points: [
      ["JSON-LD author/publisher 명시", "35pt", "text-amber-400"],
      ["발행일/수정일(dateModified)", "30pt", "text-amber-400"],
      ["평균 문장 길이 15~50자 유지", "35pt", "text-amber-400"],
    ],
  },
];

const modules = [
  {
    label: "Semantic Graph",
    labelClass: "text-indigo-400",
    title: "Entity 추출 & 커버리지",
    description:
      "인물, 조직, 장소, 기술, 제품, 이벤트 6대 개체를 분류하고, 해당 주제의 글에서 다뤄야 할 추천 키워드의 포함 여부를 진단합니다.",
    footer: "✓ 핵심 개체 분류 및 누락 키워드 추천",
    footerClass: "text-neutral-400",
  },
  {
    label: "Live Competitor Parser",
    labelClass: "text-sky-400",
    title: "경쟁사 페이지 실시간 비교",
    description:
      "경쟁사 URL을 입력하면 즉시 실시간 크롤링하여 본문 분량, 표/리스트 사용 여부, AI 인용 요소를 내 글과 1:1로 비교(+/- Gap)합니다.",
    footer: "✓ 경쟁사 대비 우위 및 보완점 즉시 도출",
    footerClass: "text-emerald-400",
  },
  {
    label: "Client-side Tool",
    labelClass: "text-emerald-400",
    title: "WebP 일괄 변환기 내장",
    description:
      "서버 전송 없이 브라우저 내에서 무거운 이미지를 차세대 규격인 WebP 포맷으로 압축 및 일괄 변환하여 페이지 로딩 속도를 높입니다.",
    footer: "✓ Drag & Drop 브라우저 로컬 일괄 변환",
    footerClass: "text-neutral-400",
  },
];

const faqs = [
  {
    question: "Q. 일반 방문자나 블로거도 바로 설치해서 쓸 수 있나요?",
    answer: (
      <>
        <p>
          아닙니다. AX SEO Manager는 독립형 일반 앱이 아닌{" "}
          <strong>그누보드5 기반 웹사이트 전용 연동 솔루션</strong>입니다.
        </p>
        <p>
          운영 중인 홈페이지의 개발자 또는 웹마스터가 그누보드 내부 파일(
          <code>write_update.php</code>)에 연동 코드를 탑재해야 게시판 글이
          자동으로 AX SEO Manager 콘솔에 등록되어 진단 및 초안 생성이
          가능합니다.
        </p>
      </>
    ),
  },
  {
    question: "Q. [AI 최적화 실행] 버튼을 누르면 구체적으로 무엇이 자동으로 작성되나요?",
    answer: (
      <>
        <p>
          인공지능이 게시판의 본문 내용을 처음부터 끝까지 정밀 파싱하여 다음
          6가지 항목의 최적화 초안을 생성합니다:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-neutral-300">
          <li>
            <strong>SEO Title & Description:</strong> 검색 포털 기준 글자 수와
            키워드 배치가 맞춰진 제목/설명문
          </li>
          <li>
            <strong>OG Title & Description:</strong> 카카오톡, 페이스북 등 SNS
            링크 공유용 오픈그래프 문구
          </li>
          <li>
            <strong>FAQ (질문-답변 3종):</strong> ChatGPT 등 LLM이 즉각
            인용하기 가장 좋은 Q&A 형태의 문답 데이터
          </li>
          <li>
            <strong>AEO 한 줄 답변 (ae_answer):</strong> 사용자의 질의에
            인공지능이 1초 안에 인용할 수 있는 핵심 정의문
          </li>
          <li>
            <strong>GEO 요약문:</strong> 검색 생성 요약(SGE)에 반영되기 적합한
            50자 이상의 전문적 본문 요약
          </li>
          <li>
            <strong>Schema.org JSON-LD:</strong> 작성자, 발행일, 수정일, FAQ
            구조화 데이터가 포함된 표준 스크립트
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Q. 생성된 AI 초안이 실제 홈페이지 게시글에 자동으로 덮어써지나요?",
    answer: (
      <>
        <p>
          <strong>아닙니다. 관리자의 안전한 검토 후에만 반영됩니다.</strong>
        </p>
        <p className="mt-2">
          AI가 작성한 문구는 우선 AX 콘솔 내 초안(Draft)으로 저장됩니다.
          관리자가 내용을 눈으로 확인하고, 비즈니스 톤앤매너에 맞게 다듬은 뒤
          원하는 항목만 선택하여 실제 게시글의 메타 태그나 본문에 최종
          반영하는 휴먼 인 더 루프 방식으로 안전하게 운영됩니다.
        </p>
      </>
    ),
  },
  {
    question: "Q. 워드프레스(WordPress)나 카페24, 쇼피파이 쇼핑몰도 지원하나요?",
    answer: (
      <>
        <p>
          현재 버전(v1.0)은{" "}
          <strong>그누보드5(Gnuboard 5)만 공식 지원</strong>합니다.
        </p>
        <p className="mt-2">
          국내 웹 에이전시 및 병원/클리닉 웹사이트에서 가장 널리 쓰이는 PHP
          기반 그누보드5 환경에 완벽히 최적화되어 있으며, 워드프레스 플러그인
          및 타 CMS 연동은 차기 로드맵에서 순차 지원될 예정입니다.
        </p>
      </>
    ),
  },
  {
    question: "Q. 'DB 기준 분석'과 'Live 크롤링 분석'의 차이점은 무엇인가요?",
    answer: (
      <>
        <p>
          <strong>DB 기준:</strong> 그누보드에서 넘어온 글 제목과 본문 텍스트
          데이터만을 기준으로 즉각 점수를 산출합니다.
        </p>
        <p>
          <strong>Live 기준:</strong> 실제 방문자가 접속하는 웹페이지의 배포
          URL을 백엔드 서버에서 직접 가져와 렌더링된 HTML DOM을 크롤링합니다.
          H1 태그의 실제 렌더링 상태, 이미지 ALT 누락 여부, 내부 링크 연결
          상태 등을 정밀 검사하며 결과는 DB에 저장되어 영구 보존됩니다.
        </p>
      </>
    ),
  },
  {
    question: "Q. 점수(Overall Score)는 어떤 기준으로 책정되며 어떻게 올려야 하나요?",
    answer: (
      <>
        <p>
          7대 지표(SEO · AEO · GEO · Content · Citation · E-E-A-T ·
          Readability) 각 100점 만점의 평균값으로 계산되며, 90점 이상일 경우
          Grade A+가 부여됩니다.
        </p>
        <p className="mt-2">
          상세 페이지 하단의 <strong>[개선 추천]</strong> 섹션에서 어떤 항목을
          고쳤을 때 몇 점이 오르는지 영향도 순으로 안내되므로, 리스트에 적힌
          순서대로 수정하면 손쉽게 90점 이상으로 끌어올릴 수 있습니다.
        </p>
      </>
    ),
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07080a] text-[#ececed] antialiased selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07080a]/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1720px] items-center justify-between px-6 sm:px-12">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 text-xs font-black text-black">
                AX
              </span>
              <span className="text-base font-extrabold uppercase tracking-normal text-white transition-colors group-hover:text-neutral-300">
                AX SEO Manager
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-xs uppercase tracking-wider text-neutral-400 md:flex">
              <a href="#how-it-works" className="transition-colors hover:text-white">
                How it works
              </a>
              <a href="#features" className="transition-colors hover:text-white">
                Features
              </a>
              <a href="#comparison" className="transition-colors hover:text-white">
                Core Engine
              </a>
              <a href="#faq" className="transition-colors hover:text-white">
                Q&A
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="/manual.html"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-wider text-neutral-300 transition-all hover:border-white/25 hover:text-white"
            >
              매뉴얼 가이드
            </a>
            <Link
              href="/contents"
              className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black shadow-lg transition-all hover:bg-neutral-200 hover:shadow-white/10"
            >
              관리자 화면 바로가기 →
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1720px] px-6 pb-16 pt-20 sm:px-12">
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs text-neutral-300 font-mono-tech">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span>그누보드5 전용 AI 검색 최적화 플랫폼</span>
          <span className="text-neutral-600">|</span>
          <span className="text-indigo-400">SEO · AEO · GEO · JSON-LD</span>
        </div>

        <div className="grid grid-cols-1 items-end gap-12 border-b border-white/[0.08] pb-16 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <h1 className="text-4xl font-black uppercase leading-[1.05] tracking-normal text-white sm:text-6xl lg:text-[76px]">
              버튼 한 번으로,
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                게시글을 AI 검색이 인용하는
              </span>
              <br />
              완벽한 문구로 완성합니다.
            </h1>
            <p className="max-w-3xl text-lg font-light leading-relaxed text-neutral-400 sm:text-xl">
              그누보드5 게시판에 글을 쓰면 자동 동기화되고,{" "}
              <strong className="font-medium text-white">[AI 최적화 실행]</strong>{" "}
              버튼 하나로 SEO 메타 태그, ChatGPT 인용용 FAQ, Schema.org 구조화
              데이터 초안이 1초 만에 완성됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-4 pb-2 lg:col-span-4">
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-mono-tech">
                Zero Prompt Engineering
              </div>
              <p className="text-xs leading-relaxed text-neutral-300">
                어려운 프롬프트 입력 없이 본문만 넘기면 AI가 7가지 점수 기준에
                맞춰 최상위 노출 문구를 직관적으로 제안합니다.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/contents"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-xs font-semibold tracking-wider text-white transition-all hover:bg-indigo-500"
                >
                  최적화 콘솔 시작하기
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium text-neutral-300 transition-all hover:bg-white/10"
                >
                  이용 방법 ↓
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-white/[0.08] py-8 text-xs md:grid-cols-4">
          {stats.map(([label, value, color]) => (
            <div key={label}>
              <span className="mb-1 block text-neutral-500 uppercase tracking-wider font-mono-tech">
                {label}
              </span>
              <p className={`text-base font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1720px] px-6 pb-28 sm:px-12">
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-[#121317] shadow-2xl">
          <div className="pointer-events-none absolute -top-32 right-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0c0d10]/95 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border border-[#e0443e] bg-[#ff5f57] shadow-sm" />
                <span className="inline-block h-3 w-3 rounded-full border border-[#d89e24] bg-[#febc2e] shadow-sm" />
                <span className="inline-block h-3 w-3 rounded-full border border-[#1aab29] bg-[#28c840] shadow-sm" />
              </div>
              <span className="hidden text-xs text-neutral-500 font-mono-tech sm:inline-block">
                AX SEO Console · Live Preview
              </span>
            </div>
            <div className="mx-auto max-w-xl flex-1">
              <div className="flex h-8 w-full items-center justify-between rounded-lg border border-white/[0.08] bg-black/50 px-4 text-xs text-neutral-400 font-mono-tech">
                <span className="truncate">
                  https://ax-seo-manager.vercel.app/contents/detail?id=18
                </span>
                <span className="ml-2 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  SSL Verified
                </span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-mono-tech">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              GB5 Sync Active
            </span>
          </div>
          <div className="relative w-full overflow-hidden bg-[#f8f9fa]">
            {hasWorkPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/work_01.webp"
                alt="AX SEO Manager 실제 대시보드 화면"
                className="block h-auto w-full select-none object-cover"
              />
            ) : (
              <DashboardPreviewMockup />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/15 to-transparent" />
          </div>
          <div className="flex flex-wrap items-center justify-between border-t border-white/[0.08] bg-[#0c0d10] px-6 py-3.5 text-[11px] text-neutral-400 font-mono-tech">
            <div className="flex items-center gap-4">
              <span>
                연동 상태:{" "}
                <strong className="text-white">
                  g5_write_column (bo_table=myproject, wr_id=18)
                </strong>
              </span>
              <span className="hidden text-neutral-700 md:inline">|</span>
              <span className="hidden text-emerald-400 md:inline">
                ● Live 크롤링 파싱 완료
              </span>
            </div>
            <span>AI 모델: GPT Structured Engine · 원클릭 초안 반영 지원</span>
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <MetricsSection />
      <ModulesSection />
      <FaqSection />

      <section className="border-t border-white/[0.08] bg-gradient-to-b from-[#0e0f14] to-[#07080a] py-24">
        <div className="mx-auto max-w-[1720px] space-y-6 px-6 text-center sm:px-12">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono-tech">
            Ready to Optimize?
          </span>
          <h2 className="text-3xl font-black uppercase tracking-normal text-white sm:text-5xl">
            검색과 인공지능이 먼저 추천하는 콘텐츠로 바꾸세요.
          </h2>
          <p className="mx-auto max-w-xl text-sm font-light text-neutral-400 sm:text-base">
            지금 그누보드5 게시글을 등록하고 버튼 하나로 완성되는 SEO · AEO ·
            GEO 최적화 초안을 직접 경험해보세요.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/contents"
              className="rounded-xl bg-white px-8 py-4 text-xs font-bold uppercase tracking-wider text-black shadow-xl transition-all hover:bg-neutral-200"
            >
              관리자 화면 시작하기 →
            </Link>
            <a
              href="/manual.html"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-xs font-medium uppercase tracking-wider text-white transition-all hover:bg-white/10"
            >
              기능 매뉴얼 상세 보기
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#07080a] py-12">
        <div className="mx-auto flex max-w-[1720px] flex-col items-center justify-between gap-6 px-6 text-xs text-neutral-500 font-mono-tech sm:flex-row sm:px-12">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">AX SEO MANAGER</span>
            <span>·</span>
            <span>AI Search Optimization Engine for Gnuboard 5</span>
          </div>
          <span>2026 AX SEO Manager · All Rights Reserved.</span>
        </div>
      </footer>
    </main>
  );
}

function DashboardPreviewMockup() {
  return (
    <div className="grid min-h-[420px] grid-cols-1 gap-0 bg-[#f8f9fa] text-[#18181b] lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-neutral-200 bg-white p-6 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 text-xs font-black text-black">
            AX
          </span>
          <span className="text-sm font-black">SEO Console</span>
        </div>
        {["Dashboard", "Contents", "AI Optimize", "Live Crawl", "Settings"].map(
          (item, index) => (
            <div
              key={item}
              className={`mb-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                index === 1 ? "bg-indigo-50 text-indigo-700" : "text-neutral-500"
              }`}
            >
              {item}
            </div>
          ),
        )}
      </aside>
      <div className="p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Content Detail
            </p>
            <h3 className="mt-1 text-2xl font-black text-neutral-950">
              AI 검색 최적화 분석
            </h3>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            Live Crawl Complete
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {["SEO 92", "AEO 88", "GEO 95"].map((score) => (
            <div key={score} className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">Score</p>
              <p className="mt-3 text-3xl font-black text-neutral-950">{score}</p>
              <div className="mt-4 h-2 rounded-full bg-neutral-100">
                <div className="h-2 w-[86%] rounded-full bg-indigo-500" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-black">AI 최적화 초안</p>
            <div className="mt-4 space-y-3">
              <div className="h-3 w-11/12 rounded-full bg-neutral-200" />
              <div className="h-3 w-10/12 rounded-full bg-neutral-200" />
              <div className="h-3 w-8/12 rounded-full bg-neutral-200" />
            </div>
            <div className="mt-5 rounded-lg bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-900">
              검색 결과와 AI 답변 엔진에서 인용되기 쉬운 제목, 설명, FAQ, JSON-LD
              초안을 자동 생성합니다.
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-black">개선 추천</p>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between rounded-lg bg-neutral-50 p-3">
                <span>FAQ 3개 생성</span>
                <strong className="text-emerald-600">+40pt</strong>
              </div>
              <div className="flex justify-between rounded-lg bg-neutral-50 p-3">
                <span>이미지 ALT 보완</span>
                <strong className="text-emerald-600">+20pt</strong>
              </div>
              <div className="flex justify-between rounded-lg bg-neutral-50 p-3">
                <span>Schema.org 추가</span>
                <strong className="text-emerald-600">+15pt</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-[1720px] border-t border-white/[0.08] px-6 py-24 sm:px-12"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-4 self-start lg:sticky lg:top-32 lg:col-span-4">
          <span className="block text-xs uppercase tracking-widest text-indigo-400 font-mono-tech">
            (01) How It Works
          </span>
          <h2 className="text-3xl font-extrabold uppercase leading-tight tracking-normal text-white sm:text-4xl">
            실제 사용 방법 안내
            <br />
            <span className="font-normal text-neutral-500">글 작성부터 반영까지</span>
          </h2>
          <p className="pt-2 text-sm leading-relaxed text-neutral-400">
            복잡한 세팅 없이 기존 그누보드 게시판에서 글을 작성하면 모든
            프로세스가 시작됩니다. 관리자는 버튼만 눌러 초안을 확인하면 됩니다.
          </p>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <StepCard
            eyebrow="STEP 01. 사전 연동 및 자동 동기화"
            meta="최초 1회 설정"
            title="운영 중인 그누보드5에 연동 훅 탑재"
          >
            <p className="mb-4 text-sm leading-relaxed text-neutral-400">
              홈페이지 개발 담당자가 그누보드5의 <code>write_update.php</code>
              또는 테마 내 hook 파일에 AX 연동 코드를 추가합니다. 연동이 끝나면
              관리자나 작성자가 평소처럼 게시판에 글을 작성하거나 수정할
              때마다 본문 데이터가 AX SEO Manager 데이터베이스로 실시간
              등록됩니다.
            </p>
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4 text-xs text-neutral-300 font-mono-tech">
              사용자는 게시판 글만 쓰면 끝! 별도로 제목과 본문을 복사해서 옮겨
              붙일 필요가 없습니다.
            </div>
          </StepCard>

          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-neutral-900/40 p-8">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-400 font-mono-tech">
                STEP 02. 핵심 기능 — 원클릭 AI 초안 생성
              </span>
              <span className="rounded border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                AI Automation
              </span>
            </div>
            <h3 className="mb-3 text-2xl font-black text-white">
              [AI 최적화 실행] 버튼 1회 클릭
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-neutral-300">
              콘텐츠 상세 화면에서{" "}
              <strong className="rounded bg-indigo-600 px-2 py-0.5 text-white">
                AI 최적화 실행
              </strong>{" "}
              버튼을 누르면 인공지능이 긴 본문을 정밀 분석하여 다음 항목을 1초
              만에 자동 작성해 줍니다.
            </p>
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              {aiOutputs.map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/[0.08] bg-black/60 p-3.5"
                >
                  <span className="mb-1 block font-bold text-white">{title}</span>
                  <span className="text-neutral-400">{description}</span>
                </div>
              ))}
            </div>
          </div>

          <StepCard
            eyebrow="STEP 03. 실제 배포 페이지 Live 크롤링 검증"
            meta="HTML DOM Parser"
            title="[실제 페이지 크롤링] 버튼으로 최종 확인"
            eyebrowClass="text-emerald-400"
          >
            <p className="mb-4 text-sm leading-relaxed text-neutral-400">
              DB 데이터뿐만 아니라 실제 서비스 중인 배포 URL을 서버에서
              fetch하여 HTML 구조를 분석합니다. H1 헤딩 태그 중복 여부, 이미지
              ALT 태그 누락 개수, 내부/외부 링크 개수, 본문 실측 글자 수를
              실시간 크롤링하여 갱신합니다.
            </p>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 p-4 text-xs text-neutral-400 font-mono-tech">
              <span>크롤링 결과는 DB에 영구 보존되어 새로고침 후에도 유지됩니다.</span>
              <span className="font-bold text-emerald-400">Live 뱃지 부여</span>
            </div>
          </StepCard>

          <StepCard
            eyebrow="STEP 04. 영향도 기반 수정 & 반영"
            meta="Actionable Guide"
            title="예상 점수 상승폭(+N pt) 확인 후 실무 반영"
          >
            <p className="text-sm leading-relaxed text-neutral-400">
              하단 <strong className="text-white">[개선 추천]</strong> 섹션에서
              점수 상승 영향도가 큰 순서대로 정렬된 리스트를 확인합니다. AI가
              써준 초안 중 마음에 드는 문구를 복사하거나 선택하여 게시글에 최종
              반영하면 작업이 완료됩니다.
            </p>
          </StepCard>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  eyebrow,
  meta,
  title,
  eyebrowClass = "text-indigo-400",
  children,
}: {
  eyebrow: string;
  meta: string;
  title: string;
  eyebrowClass?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/40 p-8 transition-all hover:border-white/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs font-bold font-mono-tech ${eyebrowClass}`}>
          {eyebrow}
        </span>
        <span className="text-xs text-neutral-500 font-mono-tech">{meta}</span>
      </div>
      <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
      {children}
    </div>
  );
}

function MetricsSection() {
  return (
    <section
      id="features"
      className="mx-auto max-w-[1720px] border-t border-white/[0.08] px-6 py-24 sm:px-12"
    >
      <div className="mb-14 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-4">
          <span className="block text-xs uppercase tracking-widest text-emerald-400 font-mono-tech">
            (02) Diagnostic Engine
          </span>
          <h2 className="text-3xl font-extrabold uppercase tracking-normal text-white sm:text-4xl">
            7가지 세부 진단 기준
          </h2>
        </div>
        <div className="lg:col-span-8">
          <p className="text-base leading-relaxed text-neutral-400">
            AX SEO Manager는 모호한 점수 대신 명확한 정량적 규칙을 적용합니다.
            7개 지표는 각 100점 만점으로 계산되며, 산술 평균을 통해 종합
            Overall 등급(A+ ~ F)을 매깁니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="rounded-2xl border border-white/[0.08] bg-neutral-900/40 p-6"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-base font-bold text-white">{metric.title}</h3>
              <span className={`text-[11px] font-mono-tech ${metric.badgeClass}`}>
                {metric.badge}
              </span>
            </div>
            <p className="mb-4 text-xs text-neutral-400">{metric.description}</p>
            <div className="space-y-2 border-t border-white/[0.06] pt-3 text-xs text-neutral-300 font-mono-tech">
              {metric.points.map(([label, point, color]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span>{label}</span>
                  <span className={color}>{point}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section
      id="comparison"
      className="mx-auto max-w-[1720px] border-t border-white/[0.08] px-6 py-24 sm:px-12"
    >
      <div className="mb-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-4">
          <span className="block text-xs uppercase tracking-widest text-indigo-400 font-mono-tech">
            (03) Advanced Modules
          </span>
          <h2 className="text-3xl font-extrabold uppercase tracking-normal text-white sm:text-4xl">
            전문가를 위한 심화 분석
          </h2>
        </div>
        <div className="lg:col-span-8">
          <p className="text-base leading-relaxed text-neutral-400">
            검색 최적화 진단에 그치지 않고, 경쟁사 비교와 이미지 최적화까지
            프론트엔드 작업 전반을 보조합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {modules.map((module) => (
          <div
            key={module.title}
            className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-neutral-900/40 p-8"
          >
            <div>
              <span
                className={`mb-4 block text-xs uppercase tracking-widest font-mono-tech ${module.labelClass}`}
              >
                {module.label}
              </span>
              <h3 className="mb-2 text-xl font-bold text-white">{module.title}</h3>
              <p className="mb-6 text-xs leading-relaxed text-neutral-400">
                {module.description}
              </p>
            </div>
            <div
              className={`rounded-xl border border-white/[0.06] bg-black/50 p-3.5 text-xs font-mono-tech ${module.footerClass}`}
            >
              {module.footer}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section
      id="faq"
      className="mx-auto max-w-[1720px] border-t border-white/[0.08] px-6 py-24 sm:px-12"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-4 self-start lg:sticky lg:top-32 lg:col-span-4">
          <span className="block text-xs uppercase tracking-widest text-emerald-400 font-mono-tech">
            (04) Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-extrabold uppercase leading-tight tracking-normal text-white sm:text-4xl">
            자주 묻는 질문
            <br />
            <span className="font-normal text-neutral-500">Q&A</span>
          </h2>
          <p className="pt-2 text-sm leading-relaxed text-neutral-400">
            연동 대상 CMS, AI 자동화 작동 방식, 점수 산출 기준 등 자주 묻는
            질문들을 모았습니다.
          </p>
        </div>

        <div className="space-y-4 lg:col-span-8">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-white/[0.08] bg-neutral-900/30 p-6 transition-colors open:bg-neutral-900/60"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <span className="pr-4 text-base font-bold text-white">
                  {faq.question}
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-neutral-400 transition-transform group-open:rotate-180 font-mono-tech">
                  ↓
                </span>
              </summary>
              <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-neutral-400">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
