"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./geo.module.css";

interface AuditItem {
  label: string;
  value: string;
  passed: boolean;
  status: "good" | "warn" | "bad";
  points: number;
}

interface AuditCategory {
  key: string;
  title: string;
  description: string;
  score: number;
  items: AuditItem[];
}

interface AuditResult {
  url: string;
  finalUrl: string;
  checkedAt: string;
  elapsedMs: number;
  overall: number;
  grade: string;
  summary: {
    title: string | null;
    description: string | null;
    h1Count: number;
    h2Count: number;
    imageCount: number;
    missingAlt: number;
    internal: number;
    external: number;
    schemaCount: number;
    charCount: number;
  };
  categories: AuditCategory[];
}

interface ScoreMeta {
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  color: string;
  label: string;
}

interface RankedIssue {
  category: string;
  label: string;
  message: string;
  impact: number;
  severity: "HIGH" | "MEDIUM";
}

const defaultUrl = "https://";

const categoryShortName: Record<string, string> = {
  crawl: "크롤링",
  meta: "검색 메타",
  schema: "구조화 데이터",
  content: "콘텐츠",
  structure: "정보 구조",
  trust: "브랜드 신뢰",
  media: "미디어",
  experience: "페이지 경험",
};

const whyDescriptions: Record<string, string> = {
  "HTTP 응답": "페이지가 정상 응답해야 검색엔진과 AI 크롤러가 콘텐츠를 수집할 수 있습니다.",
  "외부 접속": "진단 서버가 페이지 HTML을 가져와야 실제 검색 노출 상태를 확인할 수 있습니다.",
  "입력 URL 형식": "정확한 URL 형식은 진단 요청이 올바른 대상에 도달하기 위한 기본 조건입니다.",
  "네트워크 상태": "서버 네트워크나 대상 사이트 차단 정책에 따라 크롤링 진단이 실패할 수 있습니다.",
  "색인 허용": "noindex가 있으면 검색엔진이 페이지를 색인하지 않을 수 있습니다.",
  "HTML 수집": "본문 HTML이 충분히 수집되어야 GEO·AEO 항목을 제대로 평가할 수 있습니다.",
  Title: "검색 결과와 AI 요약에서 페이지 주제를 파악하는 가장 기본적인 신호입니다.",
  Description: "Meta Description은 검색 결과 설명과 AI 답변의 요약 맥락에 영향을 줍니다.",
  "Open Graph": "공유 화면과 AI가 참고하는 대표 제목·설명 정보를 보강합니다.",
  Canonical: "대표 URL을 명확히 알려 중복 페이지로 인한 신호 분산을 줄입니다.",
  "JSON-LD": "검색엔진과 AI가 페이지 유형, 조직, FAQ, 문맥을 구조적으로 이해하도록 돕습니다.",
  "FAQ 신호": "질문과 답변 구조는 ChatGPT·Perplexity 같은 답변형 AI가 인용하기 좋은 형태입니다.",
  "조직/웹사이트 신호": "브랜드와 운영 주체를 구조화하면 신뢰도 판단에 도움이 됩니다.",
  "본문 분량": "충분한 본문은 AI가 답변 재료로 사용할 맥락과 근거를 늘려줍니다.",
  "질문형 콘텐츠": "사용자 질문과 직접 연결되는 문장은 AEO 성능에 특히 중요합니다.",
  "표/리스트": "비교표와 리스트는 정보를 빠르게 파악하고 인용하기 쉬운 구조입니다.",
  "외부 출처": "신뢰 가능한 외부 링크는 콘텐츠의 근거와 전문성을 보강합니다.",
  H1: "H1은 페이지의 핵심 주제를 나타내므로 1개만 명확하게 쓰는 것이 좋습니다.",
  "H2/H3": "헤딩 계층은 긴 콘텐츠를 주제별로 나누어 AI가 맥락을 이해하게 합니다.",
  "내부 링크": "관련 페이지 연결은 사이트 주제성과 탐색성을 함께 높입니다.",
  "회사/문의 신호": "운영자 정보는 브랜드 신뢰와 E-E-A-T 판단에 영향을 줍니다.",
  "HTML lang": "언어 선언은 검색엔진과 보조기기가 콘텐츠 언어를 정확히 이해하게 합니다.",
  "브랜드명 반복": "브랜드와 핵심 주제가 본문에 자연스럽게 연결되어야 엔티티 신호가 강해집니다.",
  "이미지 ALT": "ALT는 이미지 내용을 텍스트로 설명해 검색과 AI 이해도를 높입니다.",
  "미디어 규모": "이미지가 지나치게 많으면 로딩과 콘텐츠 파악에 부담이 될 수 있습니다.",
  "모바일 viewport": "모바일 화면 대응은 검색 품질과 사용자 경험의 기본 신호입니다.",
  "HTML 크기": "HTML이 과도하게 크면 크롤링과 초기 로딩 성능에 불리할 수 있습니다.",
  "스크립트 수": "스크립트가 많으면 렌더링이 늦어지고 크롤러가 핵심 콘텐츠를 늦게 볼 수 있습니다.",
};

function getScoreMeta(score: number): ScoreMeta {
  if (score >= 90) return { grade: "A+", color: "#22c55e", label: "매우 좋음" };
  if (score >= 80) return { grade: "A", color: "#22c55e", label: "좋음" };
  if (score >= 70) return { grade: "B", color: "#eab308", label: "보통" };
  if (score >= 60) return { grade: "C", color: "#f97316", label: "개선 필요" };
  if (score >= 50) return { grade: "D", color: "#ef4444", label: "주의" };
  return { grade: "F", color: "#b91c1c", label: "위험" };
}

function getStatusLabel(status: AuditItem["status"]) {
  if (status === "good") return "통과";
  if (status === "warn") return "보완";
  return "필요";
}

function getImpact(category: AuditCategory, issue: AuditItem) {
  const missing = 100 - category.score;
  const itemWeight = issue.points === 0 ? 12 : 7;
  return Math.min(30, Math.max(4, Math.round(itemWeight + missing / 12)));
}

function getIssues(categories: AuditCategory[]) {
  return categories
    .flatMap((category) =>
      category.items
        .filter((item) => !item.passed)
        .map((item) => {
          const impact = getImpact(category, item);

          return {
            category: category.title,
            label: item.label,
            message: item.value,
            impact,
            severity: impact >= 10 ? "HIGH" : "MEDIUM",
          } satisfies RankedIssue;
        }),
    )
    .sort((a, b) => b.impact - a.impact);
}

function getInterpretation(result: AuditResult, issues: RankedIssue[]) {
  const lowest = [...result.categories].sort((a, b) => a.score - b.score)[0];
  const meta = getScoreMeta(result.overall);

  if (result.overall >= 80) {
    return `현재 페이지는 전반적으로 양호합니다. 다만 ${lowest.title} 신호를 보완하면 AI가 콘텐츠를 이해하고 인용하는 안정성을 더 높일 수 있습니다.`;
  }

  if (result.overall >= 60) {
    return `현재 페이지는 기본 검색 접근성은 갖췄지만, AI가 콘텐츠를 이해하고 인용하는 데 필요한 일부 신호가 부족합니다.`;
  }

  const firstIssue = issues[0]?.label || lowest.title;
  return `현재 페이지는 ${firstIssue} 항목의 감점이 커서 AI 검색 노출과 답변 인용 가능성이 낮게 평가되었습니다.`;
}

export default function GeoAuditClient() {
  const [url, setUrl] = useState(defaultUrl);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(false);

  const passedCount = useMemo(() => {
    if (!result) return 0;
    return result.categories.reduce(
      (sum, category) => sum + category.items.filter((item) => item.passed).length,
      0,
    );
  }, [result]);

  const totalCount = useMemo(() => {
    if (!result) return 0;
    return result.categories.reduce((sum, category) => sum + category.items.length, 0);
  }, [result]);

  const issues = useMemo(() => (result ? getIssues(result.categories) : []), [result]);
  const firstProblemCategory = result?.categories.find((category) => category.score < 80)?.key;
  const scoreMeta = result ? getScoreMeta(result.overall) : null;
  const visibleIssues = showAllIssues ? issues : issues.slice(0, 3);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setShowAllIssues(false);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/geo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "진단에 실패했습니다.");
      }

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "진단에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>AX</span>
          <span>AX SEO Manager</span>
        </Link>
        <Link href="/contents" className={styles.headerLink}>
          관리자 콘솔
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Free GEO·AEO Audit</span>
          <h1>
            사이트 주소만 넣으면
            <br />
            GEO·AEO 최적화 상태를 확인합니다.
          </h1>
          <p>
            AI 검색 노출을 위한 GEO·AEO 핵심 지표를 분석하고 개선이 필요한 항목을
            우선순위별로 진단합니다.
          </p>
        </div>

        <form className={styles.auditForm} onSubmit={handleSubmit}>
          <label htmlFor="url">진단 대상 사이트 주소</label>
          <div className={styles.inputRow}>
            <input
              id="url"
              name="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              inputMode="url"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "진단 중..." : "무료 진단 시작"}
            </button>
          </div>
          <p className={styles.formHint}>
            공개 접속 가능한 홈페이지 URL을 입력해 주세요. 결과는 저장하지 않습니다.
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
        </form>
      </section>

      {isLoading ? (
        <section className={styles.loadingPanel}>
          <div className={styles.loadingHeader}>
            <span>GEO·AEO Audit</span>
            <strong>페이지 상태 확인 중</strong>
          </div>
          <div className={styles.loadingLines}>
            <span />
            <span />
            <span />
          </div>
        </section>
      ) : null}

      {result && scoreMeta ? (
        <section className={styles.report}>
          <div className={styles.reportHeader}>
            <div>
              <span className={styles.kicker}>Audit Result</span>
              <h2>{result.summary.title || result.finalUrl}</h2>
              <p>{result.finalUrl}</p>
            </div>
            <div className={styles.scoreDial}>
              <span className={styles.scoreLabel}>GEO·AEO Score</span>
              <strong style={{ color: scoreMeta.color }}>{result.overall}</strong>
              <span>Grade {scoreMeta.grade}</span>
            </div>
          </div>

          <div className={styles.resultInsight}>
            <strong>
              {result.overall} / 100 · Grade {scoreMeta.grade}
            </strong>
            <p>{getInterpretation(result, issues)}</p>
            <div className={styles.deductionChips}>
              <span>주요 감점</span>
              {(issues.length > 0 ? issues.slice(0, 4) : [{ label: "핵심 기준 통과" }]).map(
                (issue) => (
                  <em key={issue.label}>{issue.label}</em>
                ),
              )}
            </div>
          </div>

          <div className={styles.summaryGrid}>
            <div>
              <span>체크 항목</span>
              <strong>
                {passedCount}/{totalCount}
              </strong>
            </div>
            <div>
              <span>본문 수집량</span>
              <strong>{result.summary.charCount.toLocaleString()}자</strong>
            </div>
            <div>
              <span>구조화 데이터</span>
              <strong>{result.summary.schemaCount}개</strong>
            </div>
            <div>
              <span>응답 시간</span>
              <strong>{result.elapsedMs}ms</strong>
            </div>
          </div>

          <section className={styles.analysisBlock}>
            <div className={styles.sectionHeading}>
              <span>8개 영역 분석</span>
              <strong>점수와 취약 영역을 한눈에 확인하세요.</strong>
            </div>
            <div className={styles.categoryGrid}>
              {result.categories.map((category) => {
                const meta = getScoreMeta(category.score);

                return (
                  <article key={category.key} className={styles.categoryCard}>
                    <div className={styles.categoryTop}>
                      <div>
                        <h3>{category.title}</h3>
                        <p>{category.description}</p>
                      </div>
                      <strong style={{ color: meta.color }}>{category.score}</strong>
                    </div>
                    <div className={styles.barTrack}>
                      <span
                        style={{ width: `${category.score}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className={styles.barChart}>
              {result.categories.map((category) => {
                const meta = getScoreMeta(category.score);

                return (
                  <div key={`chart-${category.key}`} className={styles.chartRow}>
                    <span>{categoryShortName[category.key] || category.title}</span>
                    <div className={styles.chartTrack}>
                      <i
                        style={{ width: `${category.score}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    <strong style={{ color: meta.color }}>{category.score}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.priorityPanel}>
            <div className={styles.panelHeader}>
              <span>Top Issues</span>
              <strong>가장 먼저 개선하세요</strong>
            </div>
            {issues.length > 0 ? (
              <>
                <ol className={styles.topIssueList}>
                  {visibleIssues.map((issue, index) => (
                    <li key={`${issue.category}-${issue.label}`}>
                      <div className={styles.issueIndex}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <em>{issue.severity}</em>
                      </div>
                      <div>
                        <h3>{issue.label}</h3>
                        <p>{issue.message}</p>
                        <strong>예상 개선 +{issue.impact}pt</strong>
                      </div>
                    </li>
                  ))}
                </ol>
                {issues.length > 3 ? (
                  <button
                    className={styles.showAllButton}
                    type="button"
                    onClick={() => setShowAllIssues((current) => !current)}
                  >
                    {showAllIssues ? "TOP 3만 보기 ↑" : `전체 ${issues.length}개 개선 항목 보기 ↓`}
                  </button>
                ) : null}
              </>
            ) : (
              <p className={styles.emptyState}>
                핵심 GEO·AEO 기준이 전반적으로 잘 갖춰져 있습니다.
              </p>
            )}
          </section>

          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <span>Detailed Audit</span>
              <strong>상세 체크리스트</strong>
            </div>
            <div className={styles.accordionList}>
              {result.categories.map((category) => {
                const failedCount = category.items.filter((item) => !item.passed).length;
                const passCount = category.items.length - failedCount;
                const meta = getScoreMeta(category.score);

                return (
                  <details
                    key={category.key}
                    className={styles.auditAccordion}
                    open={category.key === firstProblemCategory}
                  >
                    <summary>
                      <div>
                        <span
                          className={styles.categorySignal}
                          style={{ backgroundColor: meta.color }}
                        />
                        <strong>{category.title}</strong>
                      </div>
                      <div className={styles.accordionMeta}>
                        <em style={{ color: meta.color }}>{category.score}점</em>
                        <span>
                          {failedCount > 0
                            ? `${failedCount}개 개선 필요`
                            : `${passCount}/${category.items.length} 통과`}
                        </span>
                        <b>⌄</b>
                      </div>
                    </summary>
                    <div className={styles.checkGroup}>
                      {category.items.map((item) => (
                        <div key={`${category.key}-${item.label}`} className={styles.checkItem}>
                          <span className={styles[item.status]}>{getStatusLabel(item.status)}</span>
                          <div>
                            <strong>
                              {item.label}
                              <button
                                type="button"
                                className={styles.helpButton}
                                aria-label={`${item.label} 설명`}
                              >
                                ?
                                <span role="tooltip">
                                  {whyDescriptions[item.label] ||
                                    "이 항목은 AI 검색과 검색엔진이 페이지 의미를 더 정확히 이해하는 데 영향을 줍니다."}
                                </span>
                              </button>
                            </strong>
                            <p>{item.value}</p>
                          </div>
                          <em>{item.points}pt</em>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          <section className={styles.managerCta}>
            <div>
              <span className={styles.kicker}>Next Step</span>
              <h2>진단에서 끝내지 마세요.</h2>
              <p>
                무료 진단은 무엇이 문제인지 알려주고, AX SEO Manager는 그 문제를
                실제 콘텐츠 개선과 재검증 흐름으로 이어줍니다.
              </p>
            </div>
            <div className={styles.ctaCompare}>
              <div className={styles.ctaPlan}>
                <span>Free Audit</span>
                <strong>문제 발견</strong>
                <em>✓</em>
              </div>
              <i>→</i>
              <div className={styles.ctaPlanFeatured}>
                <span>AX SEO Manager</span>
                <ul>
                  <li>AI 개선</li>
                  <li>재검증</li>
                  <li>점수 추적</li>
                </ul>
              </div>
            </div>
            <Link href="/contents" className={styles.managerButton}>
              AX SEO Manager에서 개선하기 →
            </Link>
          </section>
        </section>
      ) : null}
    </main>
  );
}
