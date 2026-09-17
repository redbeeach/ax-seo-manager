import type { ReactNode } from "react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import styles from "./page.module.css";
import { publicPageMetadata, siteTitle, siteDescription } from "@/lib/site-metadata";

export const metadata = publicPageMetadata(siteTitle, siteDescription, "/");

const hasWorkPreview = existsSync(join(process.cwd(), "public", "work_01.webp"));

const colorClass = {
  amber: styles.textAmber,
  emerald: styles.textEmerald,
  indigo: styles.textIndigo,
  neutral: styles.textNeutral,
  purple: styles.textPurple,
  sky: styles.textSky,
  white: styles.textWhite,
} as const;

type ColorName = keyof typeof colorClass;

const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(" ");

const stats = [
  ["Target Engine", "Google · ChatGPT · Perplexity", "white"],
  ["Automated Output", "Title · Meta · FAQ · JSON-LD", "indigo"],
  ["Analysis Method", "Live DOM + 7가지 정밀 지표", "emerald"],
  ["Integration", "기존 글 가져오기 · 새 글 동기화 · 서브페이지", "white"],
] satisfies Array<[string, string, ColorName]>;

const aiOutputs = [
  [
    "① 검색용 SEO Title & Description",
    "본문의 핵심 주제를 담은 검색용 제목·설명과 SNS 공유용 Open Graph 문구 생성",
  ],
  [
    "② AEO 핵심 답변 & FAQ 3~5개",
    "본문에 근거한 핵심 답변과 질문·답변을 구성해 답변형 검색에 필요한 정보 정리",
  ],
  [
    "③ GEO 생성 요약문",
    "핵심 사실과 맥락을 2~3문장으로 요약해 생성형 검색이 이해하기 쉬운 정보 제공",
  ],
  [
    "④ Schema.org JSON-LD 구조화 데이터",
    "Article 기반 제목, 설명, 작성자, 발행·수정일 정보를 담은 구조화 데이터 생성",
  ],
];

const metrics = [
  {
    title: "01. SEO 점수 (100pt)",
    badge: "포털 검색 결과",
    badgeClass: "neutral",
    description: "검색용 메타 정보와 색인 관련 설정의 완성도를 진단합니다.",
    points: [
      ["Title 존재 & 60자 이하", "30pt", "indigo"],
      ["Description & 155자 이하", "30pt", "indigo"],
      ["OG 태그 (Title / Desc)", "15pt", "indigo"],
      ["Canonical & robots.txt 허용", "25pt", "indigo"],
    ],
  },
  {
    title: "02. AEO 점수 (100pt)",
    badge: "답변형 AI 인용",
    badgeClass: "sky",
    description: "ChatGPT, Perplexity가 바로 인용하기 좋은 Q&A 구조인지 평가합니다.",
    points: [
      ["FAQ 질문-답변 3개 이상", "40pt", "sky"],
      ["핵심 한 줄 답변 (ae_answer)", "30pt", "sky"],
      ["Q&A 포맷 구조화", "30pt", "sky"],
    ],
  },
  {
    title: "03. GEO 점수 (100pt)",
    badge: "생성형 검색 대비",
    badgeClass: "emerald",
    description: "생성형 검색을 위한 구조화 데이터와 요약 정보의 준비 상태를 평가합니다.",
    points: [
      ["JSON-LD 구조화 데이터 탑재", "40pt", "emerald"],
      ["전문 맥락 요약문 (50자 이상)", "30pt", "emerald"],
      ["GEO 엔티티 요약문 존재", "30pt", "emerald"],
    ],
  },
  {
    title: "04. Content 점수 (100pt)",
    badge: "Live 크롤링",
    badgeClass: "emerald",
    description: "실제 배포된 HTML 소스의 태그 완성도를 직접 파싱합니다.",
    points: [
      ["H1 1개 단독 마크업", "25pt", "indigo"],
      ["H2 섹션 구분 (2개 이상)", "15pt", "indigo"],
      ["이미지 ALT 속성 누락 0건", "20pt", "indigo"],
      ["내부링크(3개↑) / 본문 1000자↑", "30pt", "indigo"],
      ["표(<table>) 또는 목차 존재", "10pt", "indigo"],
    ],
  },
  {
    title: "05. AI Citation 점수 (100pt)",
    badge: "인용 신뢰성",
    badgeClass: "purple",
    description: "인공지능이 답변을 작성할 때 인용하기 쉬운 서식인지 검사합니다.",
    points: [
      ["도입부 400자 내 개념 정의문", "10pt", "purple"],
      ["비교 표(<table>) 및 리스트(<ul>)", "20pt", "purple"],
      ["외부 공신력 출처 표기 (cite)", "30pt", "purple"],
      ["FAQ 및 GEO 요약 포함", "40pt", "purple"],
    ],
  },
  {
    title: "06 & 07. E-E-A-T / 가독성",
    badge: "구글 권위성 지표",
    badgeClass: "amber",
    description: "작성자 권위성 입증 및 자연스러운 문장 호흡을 평가합니다.",
    points: [
      ["JSON-LD author/publisher 명시", "35pt", "amber"],
      ["발행일/수정일(dateModified)", "30pt", "amber"],
      ["평균 문장 길이 15~50자 유지", "35pt", "amber"],
    ],
  },
] satisfies Array<{
  title: string;
  badge: string;
  badgeClass: ColorName;
  description: string;
  points: Array<[string, string, ColorName]>;
}>;

const modules = [
  {
    label: "GNUboard Import",
    labelClass: "emerald",
    title: "기존 게시글 & 서브페이지 가져오기",
    description:
      "최초 연동 후 게시판명과 서브페이지를 지정해 기존 콘텐츠를 가져옵니다. 실제 페이지의 제목과 본문을 우선 수집하고, 이미 등록된 글은 같은 식별자로 갱신합니다.",
    footer: "✓ 새 글을 다시 작성하지 않고 기존 콘텐츠 관리",
    footerClass: "emerald",
  },
  {
    label: "Live Verification",
    labelClass: "sky",
    title: "메타태그 출력 & 적용 결과 확인",
    description:
      "SEO·Open Graph뿐 아니라 author, keywords, canonical, robots, Twitter 등 실제 페이지의 메타 출력을 확인합니다. AI 실행 전후 점수와 JSON-LD를 함께 비교합니다.",
    footer: "✓ 저장된 데이터와 실제 페이지 출력을 함께 점검",
    footerClass: "neutral",
  },
  {
    label: "Free GEO Audit",
    labelClass: "indigo",
    title: "연동 전에도 URL로 무료 진단",
    description:
      "공개 접속 가능한 사이트 주소만 입력해 GEO·AEO 핵심 항목과 개선 우선순위를 확인합니다. 그누보드 연동 없이 진단할 수 있으며 결과는 저장하지 않습니다.",
    footer: "✓ 먼저 진단하고 필요한 개선부터 시작",
    footerClass: "neutral",
  },
  {
    label: "Semantic Graph",
    labelClass: "indigo",
    title: "Entity 추출 & 커버리지",
    description:
      "인물, 조직, 장소, 기술, 제품, 이벤트 6대 개체를 분류하고, 해당 주제의 글에서 다뤄야 할 추천 키워드의 포함 여부를 진단합니다.",
    footer: "✓ 핵심 개체 분류 및 누락 키워드 추천",
    footerClass: "neutral",
  },
  {
    label: "Live Competitor Parser",
    labelClass: "sky",
    title: "경쟁사 페이지 실시간 비교",
    description:
      "경쟁사 URL을 입력하면 즉시 실시간 크롤링하여 본문 분량, 표/리스트 사용 여부, AI 인용 요소를 내 글과 1:1로 비교(+/- Gap)합니다.",
    footer: "✓ 경쟁사 대비 우위 및 보완점 즉시 도출",
    footerClass: "emerald",
  },
  {
    label: "Client-side Tool",
    labelClass: "emerald",
    title: "WebP 일괄 변환기 내장",
    description:
      "서버 전송 없이 브라우저 내에서 무거운 이미지를 차세대 규격인 WebP 포맷으로 압축 및 일괄 변환하여 페이지 로딩 속도를 높입니다.",
    footer: "✓ Drag & Drop 브라우저 로컬 일괄 변환",
    footerClass: "neutral",
  },
] satisfies Array<{
  label: string;
  labelClass: ColorName;
  title: string;
  description: string;
  footer: string;
  footerClass: ColorName;
}>;

const faqs = [
  {
    question: "Q. 일반 방문자나 블로거도 바로 설치해서 쓸 수 있나요?",
    answer: (
      <>
        <p>
          URL을 입력하는 <strong>GEO·AEO 무료진단</strong>은 그누보드 연동 없이
          이용할 수 있습니다. 콘텐츠 관리와 자동 적용은 그누보드5 연동이 필요합니다.
        </p>
        <p>
          개발자 또는 웹마스터가 내보내기 PHP 파일과 메타 출력 코드를 설정하면
          기존 게시글·지정 서브페이지를 가져올 수 있습니다. 새 글과 수정 글의
          자동 동기화는 별도 연동 훅을 연결해 사용합니다.
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
        <ul className={styles.faqList}>
          <li>
            <strong>SEO Title & Description:</strong> 검색 포털 기준 글자 수와
            키워드 배치가 맞춰진 제목/설명문
          </li>
          <li>
            <strong>OG Title & Description:</strong> 카카오톡, 페이스북 등 SNS
            링크 공유용 오픈그래프 문구
          </li>
          <li>
            <strong>FAQ (질문-답변 3~5개):</strong> 본문에 근거한 Q&A 형태의 문답 데이터
          </li>
          <li>
            <strong>AEO 한 줄 답변 (ae_answer):</strong> 사용자의 질의에
            바로 활용할 수 있도록 정리한 핵심 정의문
          </li>
          <li>
            <strong>GEO 요약문:</strong> 핵심 사실과 근거를 담은 2~3문장 본문 요약
          </li>
          <li>
            <strong>Schema.org JSON-LD:</strong> Article 기반 작성자, 발행일,
            수정일 정보가 포함된 구조화 데이터
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Q. AI 최적화를 실행하면 실제 홈페이지에 무엇이 반영되나요?",
    answer: (
      <>
        <p>
          <strong>최적화 데이터가 저장되고, 연동된 메타 출력 코드에서 사용됩니다.</strong>
        </p>
        <p className={styles.paragraphGap}>
          SEO 제목·설명, Open Graph, FAQ, AEO 답변, GEO 요약, JSON-LD를 생성하며
          원본 게시글 본문을 통째로 바꾸는 작업은 아닙니다. 그누보드의 메타 출력
          연동이 완료되어야 실제 페이지에 반영됩니다. 실행 후 Live 크롤링으로
          출력 결과를 다시 확인하고 필요한 문구는 편집할 수 있습니다.
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
        <p className={styles.paragraphGap}>
          자동 동기화와 메타 적용은 그누보드5 환경을 대상으로 제공합니다.
          다른 CMS의 공개 페이지도 URL 기반 무료진단은 가능하지만,
          워드프레스·쇼피파이용 자동 적용 연동은 제공하지 않습니다.
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
          URL을 백엔드 서버에서 직접 가져와 응답 HTML을 분석합니다.
          H1 태그의 실제 렌더링 상태, 이미지 ALT 누락 여부, 내부 링크 연결
          상태 등을 검사하고 결과를 저장합니다. 기존 콘텐츠 가져오기에서도
          실제 페이지 본문을 우선 수집하며, 수집에 실패하면 내보내기 데이터를 사용합니다.
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
        <p className={styles.paragraphGap}>
          상세 페이지 하단의 <strong>[개선 추천]</strong> 섹션에서 어떤 항목을
          고쳤을 때 몇 점이 오르는지 영향도 순으로 안내되므로, 리스트에 적힌
          순서대로 보완할 수 있습니다. 점수는 내부 진단 기준이며 검색 순위나
          AI 인용을 보장하는 지표는 아닙니다.
        </p>
      </>
    ),
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link href="/" className={styles.logoLink}>
              <span className={styles.logoMark}>
                AX
              </span>
              <span className={styles.logoText}>
                AX SEO Manager
              </span>
            </Link>
            <nav className={styles.nav}>
              <a href="#how-it-works">
                How it works
              </a>
              <a href="#features">
                Features
              </a>
              <a href="#comparison">
                Core Engine
              </a>
              <a href="#faq">
                Q&A
              </a>
            </nav>
          </div>

          <div className={styles.headerActions}>
            <a
              href="/manual.html"
              className={styles.secondaryPill}
            >
              매뉴얼 가이드
            </a>
            <Link
              href="/geo"
              className={styles.geoPill}
            >
              GEO·AEO 무료진단
            </Link>
            <Link
              href="/contents"
              className={styles.primaryPill}
            >
              관리자 화면 바로가기 →
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.kicker}>
          <span className={styles.pulseDot} />
          <span>그누보드5 전용 AI 검색 최적화 플랫폼</span>
          <span className={styles.kickerDivider}>|</span>
          <span className={styles.textIndigo}>SEO · AEO · GEO · JSON-LD</span>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>
              AX SEO Manager
              <br />
              <span className={styles.gradientText}>
                그누보드 콘텐츠의
              </span>
              <br />
              AI 검색 최적화.
            </h1>
            <p className={styles.heroLead}>
              기존 게시글과 서브페이지를 가져와 실제 페이지 기준으로 분석하세요.{" "}
              <strong className={styles.textWhiteMedium}>[AI 최적화 실행]</strong>{" "}
              버튼으로 SEO 메타태그, FAQ, 핵심 답변과 JSON-LD를 생성하고,
              연동된 그누보드 적용부터 Live 검증까지 이어집니다.
            </p>
          </div>

          <div className={styles.heroAside}>
            <div className={styles.promptCard}>
              <div className={styles.cardEyebrowGreen}>
                Zero Prompt Engineering
              </div>
              <p className={styles.smallMutedText}>
                글을 다시 작성하지 않아도 됩니다. 기존 콘텐츠를 연결하고
                7가지 진단 지표로 개선할 부분을 확인하세요.
              </p>
              <div className={styles.promptActions}>
                <Link
                  href="/geo"
                  className={styles.geoButton}
                >
                  GEO·AEO 무료진단
                </Link>
                <Link
                  href="/contents"
                  className={styles.consoleButton}
                >
                  최적화 콘솔 시작하기
                </Link>
                <a
                  href="#how-it-works"
                  className={styles.outlineButton}
                >
                  이용 방법 ↓
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {stats.map(([label, value, color]) => (
            <div key={label}>
              <span className={styles.statLabel}>
                {label}
              </span>
              <p className={cx(styles.statValue, colorClass[color])}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.previewSection}>
        <div className={styles.previewShell}>
          <div className={styles.previewGlow} />
          <div className={styles.previewTopbar}>
            <div className={styles.browserLeft}>
              <div className={styles.browserDots}>
                <span className={cx(styles.browserDot, styles.browserDotRed)} />
                <span className={cx(styles.browserDot, styles.browserDotYellow)} />
                <span className={cx(styles.browserDot, styles.browserDotGreen)} />
              </div>
              <span className={styles.previewTitle}>
                AX SEO Console · Live Preview
              </span>
            </div>
            <div className={styles.addressWrap}>
              <div className={styles.addressBar}>
                <span className={styles.truncateText}>
                  https://ax-seo-manager.vercel.app/contents/detail?id=18
                </span>
                <span className={styles.sslBadge}>
                  SSL Verified
                </span>
              </div>
            </div>
            <span className={styles.syncBadge}>
              <span className={styles.pulseDotSmall} />
              GB5 Sync Active
            </span>
          </div>
          <div className={styles.previewBody}>
            {hasWorkPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/work_01.webp"
                alt="AX SEO Manager 실제 대시보드 화면"
                className={styles.previewImage}
              />
            ) : (
              <DashboardPreviewMockup />
            )}
            <div className={styles.previewFade} />
          </div>
          <div className={styles.previewStatusbar}>
            <div className={styles.statusLeft}>
              <span>
                연동 상태:{" "}
                <strong className={styles.textWhite}>
                  g5_write_column (bo_table=myproject, wr_id=18)
                </strong>
              </span>
              <span className={styles.desktopDivider}>|</span>
              <span className={styles.desktopGreenText}>
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

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <span className={styles.cardEyebrowGreen}>
            Ready to Optimize?
          </span>
          <h2 className={styles.ctaTitle}>
            검색과 인공지능이 먼저 추천하는 콘텐츠로 바꾸세요.
          </h2>
          <p className={styles.ctaText}>
            URL 무료진단으로 개선할 부분을 확인하거나, 그누보드5를 연결해
            기존 콘텐츠 가져오기부터 AI 최적화와 적용 결과 확인까지 시작하세요.
          </p>
          <div className={styles.ctaActions}>
            <Link
              href="/contents"
              className={styles.largePrimaryButton}
            >
              관리자 화면 시작하기 →
            </Link>
            <a
              href="/manual.html"
              className={styles.largeOutlineButton}
            >
              기능 매뉴얼 상세 보기
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>AX SEO MANAGER</span>
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
    <div className={styles.mockup}>
      <aside className={styles.mockupSidebar}>
        <div className={styles.mockupBrand}>
          <span className={styles.mockupLogo}>
            AX
          </span>
          <span className={styles.mockupLogoText}>SEO Console</span>
        </div>
        {["Dashboard", "Contents", "AI Optimize", "Live Crawl", "Settings"].map(
          (item, index) => (
            <div
              key={item}
              className={cx(
                styles.mockupMenuItem,
                index === 1 ? styles.mockupMenuItemActive : styles.mockupMenuItemMuted,
              )}
            >
              {item}
            </div>
          ),
        )}
      </aside>
      <div className={styles.mockupContent}>
        <div className={styles.mockupHeader}>
          <div>
            <p className={styles.mockupEyebrow}>
              Content Detail
            </p>
            <h3 className={styles.mockupTitle}>
              AI 검색 최적화 분석
            </h3>
          </div>
          <div className={styles.mockupStatus}>
            Live Crawl Complete
          </div>
        </div>
        <div className={styles.scoreGrid}>
          {["SEO 92", "AEO 88", "GEO 95"].map((score) => (
            <div key={score} className={styles.scoreCard}>
              <p className={styles.scoreLabel}>Score</p>
              <p className={styles.scoreValue}>{score}</p>
              <div className={styles.scoreTrack}>
                <div className={styles.scoreBar} />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.mockupBottomGrid}>
          <div className={styles.mockupPanel}>
            <p className={styles.mockupPanelTitle}>AI 최적화 초안</p>
            <div className={styles.skeletonLines}>
              <div className={cx(styles.skeletonLine, styles.skeletonLineWide)} />
              <div className={cx(styles.skeletonLine, styles.skeletonLineMedium)} />
              <div className={cx(styles.skeletonLine, styles.skeletonLineShort)} />
            </div>
            <div className={styles.mockupNote}>
              검색 결과와 AI 답변 엔진에서 인용되기 쉬운 제목, 설명, FAQ, JSON-LD
              초안을 자동 생성합니다.
            </div>
          </div>
          <div className={styles.mockupPanel}>
            <p className={styles.mockupPanelTitle}>개선 추천</p>
            <div className={styles.recommendList}>
              <div className={styles.recommendItem}>
                <span>FAQ 3개 생성</span>
                <strong className={styles.recommendScore}>+40pt</strong>
              </div>
              <div className={styles.recommendItem}>
                <span>이미지 ALT 보완</span>
                <strong className={styles.recommendScore}>+20pt</strong>
              </div>
              <div className={styles.recommendItem}>
                <span>Schema.org 추가</span>
                <strong className={styles.recommendScore}>+15pt</strong>
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
      className={styles.contentSection}
    >
      <div className={styles.sectionGrid}>
        <div className={styles.stickySectionIntro}>
          <span className={cx(styles.sectionEyebrow, styles.textIndigo)}>
            (01) How It Works
          </span>
          <h2 className={styles.sectionTitle}>
            실제 사용 방법 안내
            <br />
            <span className={styles.sectionTitleMuted}>기존 글 가져오기부터 검증까지</span>
          </h2>
          <p className={styles.sectionLead}>
            최초 연동을 마치면 기존 게시글과 지정 서브페이지를 가져올 수 있습니다.
            실제 페이지 분석, AI 생성, 메타 적용과 검증을 한 흐름으로 관리하세요.
          </p>
        </div>

        <div className={styles.sectionMain}>
          <StepCard
            eyebrow="STEP 01. 연동 & 기존 콘텐츠 가져오기"
            meta="최초 1회 설정"
            title="게시판과 서브페이지를 지정해 콘텐츠 등록"
          >
            <p className={styles.cardParagraph}>
              홈페이지 담당자가 내보내기 PHP 파일, 인증키와 메타 출력 코드를
              최초 설정합니다. 콘솔에서 게시판명과 서브페이지를 지정하면 기존
              콘텐츠를 가져오고 실제 페이지의 제목·본문을 우선 수집합니다.
              새 글·수정 글 동기화는 그누보드 연동 훅으로 연결합니다.
            </p>
            <div className={styles.codeNote}>
              이미 등록된 게시글은 게시판명·글 번호 기준으로 갱신되어
              같은 글을 다시 등록할 필요가 없습니다.
            </div>
          </StepCard>

          <div className={styles.aiStepCard}>
            <div className={styles.aiStepGlow} />
            <div className={styles.stepHeader}>
              <span className={cx(styles.stepEyebrow, styles.textEmerald)}>
                STEP 02. AI 최적화 데이터 생성 & 메타 반영
              </span>
              <span className={styles.aiBadge}>
                AI Automation
              </span>
            </div>
            <h3 className={styles.aiStepTitle}>
              [AI 최적화 실행] 버튼 1회 클릭
            </h3>
            <p className={styles.aiStepText}>
              콘텐츠 상세 화면에서{" "}
              <strong className={styles.inlineBadge}>
                AI 최적화 실행
              </strong>{" "}
              버튼을 누르면 저장된 콘텐츠를 기반으로 다음 항목을 생성합니다.
              결과는 저장되고 연동된 그누보드 메타 출력에 사용됩니다.
            </p>
            <div className={styles.aiOutputGrid}>
              {aiOutputs.map(([title, description]) => (
                <div
                  key={title}
                  className={styles.aiOutputCard}
                >
                  <span className={styles.aiOutputTitle}>{title}</span>
                  <span className={styles.textNeutral}>{description}</span>
                </div>
              ))}
            </div>
          </div>

          <StepCard
            eyebrow="STEP 03. 실제 배포 페이지 Live 크롤링 검증"
            meta="HTML DOM Parser"
            title="실제 페이지 출력과 최적화 전후 점수 확인"
            eyebrowClass="emerald"
          >
            <p className={styles.cardParagraph}>
              AI 실행 후 실제 페이지를 다시 가져와 메타태그와 JSON-LD 출력을
              확인합니다. 별도 크롤링 버튼으로 제목·본문과 분석 결과를 갱신하고,
              H1·H2 구조, 이미지 ALT, 링크, 본문 분량도 함께 점검합니다.
            </p>
            <div className={styles.inlineNote}>
              <span>크롤링 결과는 저장되어 새로고침 후에도 확인할 수 있습니다.</span>
              <span className={styles.noteStrongGreen}>Live 뱃지 부여</span>
            </div>
          </StepCard>

          <StepCard
            eyebrow="STEP 04. 영향도 기반 수정 & 반영"
            meta="Actionable Guide"
            title="예상 점수 상승폭(+N pt) 확인 후 실무 반영"
          >
            <p className={styles.cardParagraphNoMargin}>
              하단 <strong className={styles.textWhite}>[개선 추천]</strong> 섹션에서
              점수 상승 영향도가 큰 순서대로 개선 항목을 확인합니다.
              메타 문구는 편집하고, 헤딩·이미지 ALT·본문 구조처럼 원본 페이지에서
              고쳐야 하는 항목은 사이트에 반영한 뒤 다시 크롤링해 확인합니다.
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
  eyebrowClass = "indigo",
  children,
}: {
  eyebrow: string;
  meta: string;
  title: string;
  eyebrowClass?: ColorName;
  children: ReactNode;
}) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepHeader}>
        <span className={cx(styles.stepEyebrow, colorClass[eyebrowClass])}>
          {eyebrow}
        </span>
        <span className={styles.stepMeta}>{meta}</span>
      </div>
      <h3 className={styles.stepTitle}>{title}</h3>
      {children}
    </div>
  );
}

function MetricsSection() {
  return (
    <section
      id="features"
      className={styles.contentSection}
    >
      <div className={styles.sectionHeaderGrid}>
        <div className={styles.sectionIntro}>
          <span className={cx(styles.sectionEyebrow, styles.textEmerald)}>
            (02) Diagnostic Engine
          </span>
          <h2 className={styles.sectionTitleSimple}>
            7가지 세부 진단 기준
          </h2>
        </div>
        <div className={styles.sectionTextColumn}>
          <p className={styles.sectionDescription}>
            AX SEO Manager는 모호한 점수 대신 명확한 정량적 규칙을 적용합니다.
            7개 지표는 각 100점 만점으로 계산되며, 산술 평균을 통해 종합
            Overall 등급(A+ ~ F)을 매깁니다.
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className={styles.metricCard}
          >
            <div className={styles.metricHeader}>
              <h3 className={styles.metricTitle}>{metric.title}</h3>
              <span className={cx(styles.metricBadge, colorClass[metric.badgeClass])}>
                {metric.badge}
              </span>
            </div>
            <p className={styles.metricDescription}>{metric.description}</p>
            <div className={styles.metricPoints}>
              {metric.points.map(([label, point, color]) => (
                <div key={label} className={styles.metricPoint}>
                  <span>{label}</span>
                  <span className={colorClass[color]}>{point}</span>
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
      className={styles.contentSection}
    >
      <div className={styles.sectionHeaderGridTight}>
        <div className={styles.sectionIntro}>
          <span className={cx(styles.sectionEyebrow, styles.textIndigo)}>
            (03) Advanced Modules
          </span>
          <h2 className={styles.sectionTitleSimple}>
            전문가를 위한 심화 분석
          </h2>
        </div>
        <div className={styles.sectionTextColumn}>
          <p className={styles.sectionDescription}>
            검색 최적화 진단에 그치지 않고, 경쟁사 비교와 이미지 최적화까지
            프론트엔드 작업 전반을 보조합니다.
          </p>
        </div>
      </div>

      <div className={styles.modulesGrid}>
        {modules.map((module) => (
          <div
            key={module.title}
            className={styles.moduleCard}
          >
            <div>
              <span
                className={cx(styles.moduleLabel, colorClass[module.labelClass])}
              >
                {module.label}
              </span>
              <h3 className={styles.moduleTitle}>{module.title}</h3>
              <p className={styles.moduleDescription}>
                {module.description}
              </p>
            </div>
            <div
              className={cx(styles.moduleFooter, colorClass[module.footerClass])}
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
      className={styles.contentSection}
    >
      <div className={styles.sectionGrid}>
        <div className={styles.stickySectionIntro}>
          <span className={cx(styles.sectionEyebrow, styles.textEmerald)}>
            (04) Frequently Asked Questions
          </span>
          <h2 className={styles.sectionTitle}>
            자주 묻는 질문
            <br />
            <span className={styles.sectionTitleMuted}>Q&A</span>
          </h2>
          <p className={styles.sectionLead}>
            연동 대상 CMS, AI 자동화 작동 방식, 점수 산출 기준 등 자주 묻는
            질문들을 모았습니다.
          </p>
        </div>

        <div className={styles.faqItems}>
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className={styles.faqItem}
            >
              <summary className={styles.faqSummary}>
                <span className={styles.faqQuestion}>
                  {faq.question}
                </span>
                <span className={styles.faqIcon}>
                  ↓
                </span>
              </summary>
              <div className={styles.faqAnswer}>
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
