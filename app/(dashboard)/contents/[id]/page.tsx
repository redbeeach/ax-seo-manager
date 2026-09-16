import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import AiOptimizeButton from '@/components/AiOptimizeButton'
import { calculateScores } from '@/lib/score/calculate'
import { buildGb5PageUrl, buildGb5PostUrl, buildLiveUrl } from '@/lib/gb5/url'
import { htmlToText } from '@/lib/gb5/crawl'
import { analyzeKeywords } from '@/lib/keywords/analyze'
import VersionHistory from '@/components/VersionHistory'
import ContentInsights from '@/components/ContentInsights'
import CompareCard from '@/components/CompareCard'

interface FaqItem {
  question: string
  answer: string
}

interface ContentRecord {
  id: string
  title: string
  body: string | null
  seo_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  faq_json: FaqItem[] | null
  ae_answer: string | null
  geo_summary: string | null
  json_ld: Record<string, unknown> | null
  canonical_url: string | null
  robots_index: boolean | null
  robots_follow: boolean | null
  page_slug: string | null
  gb5_bo_table: string | null
  gb5_wr_id: string | number | null
  created_at: string
}

interface LiveAnalysisRecord {
  url: string
  crawled_at: string
  content_score: number
  content_breakdown: {
    label: string
    points: number
    maxPoints: number
    passed: boolean
  }[]
  content_stats: Record<string, unknown>
}

interface EntityAnalysisRecord {
  topic: string | null
  entities: Record<string, string>[]
  related_terms_coverage: { term: string; reason: string; covered: boolean }[]
  covered_count: number
  total_count: number
  coverage_ratio: number
  is_live: boolean
  analyzed_at: string
}

interface ScoreHistoryRecord {
  id: string
  recorded_at: string
  recorded_date: string
  overall_score: number | null
  seo_score: number | null
  aeo_score: number | null
  geo_score: number | null
  content_score: number | null
  citation_score: number | null
  eeat_score: number | null
  readability_score: number | null
}

function getGrade(score: number) {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function averageScore(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function formatKstDateTime(value: string | null | undefined) {
  if (!value) return null
  const isoValue = /Z$|[+-]\d{2}:?\d{2}$/.test(value) ? value : value + 'Z'
  return new Date(isoValue).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const { data } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()
  const content = data as ContentRecord | null

  if (!content) return {}

  const canonicalUrl = buildLiveUrl(content) ?? undefined

  return {
    title: content.seo_title || content.title,
    description: content.meta_description || undefined,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    robots: {
      index: content.robots_index !== false,
      follow: content.robots_follow !== false,
    },
    openGraph: {
      title: content.og_title || content.title,
      description: content.og_description || undefined,
    },
  }
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()
  const content = data as ContentRecord | null

  if (error || !content) {
    notFound()
  }

  const displayBody = htmlToText(content.body ?? '')
  const liveUrl = buildLiveUrl(content)

  const scores = calculateScores({
    title: content.title,
    seo_title: content.seo_title,
    meta_description: content.meta_description,
    og_title: content.og_title,
    og_description: content.og_description,
    faq_json: content.faq_json,
    ae_answer: content.ae_answer,
    geo_summary: content.geo_summary,
    json_ld: content.json_ld,
    body: displayBody,
    canonical_url: content.canonical_url,
    robots_index: content.robots_index,
    robots_follow: content.robots_follow,
    page_slug: content.page_slug,
    gb5_bo_table: content.gb5_bo_table,
    gb5_wr_id: content.gb5_wr_id,
  })

  const baselineScores = calculateScores({
    title: content.title,
    seo_title: null,
    meta_description: null,
    og_title: null,
    og_description: null,
    faq_json: null,
    ae_answer: null,
    geo_summary: null,
    json_ld: null,
    body: displayBody,
    canonical_url: content.canonical_url,
    robots_index: content.robots_index,
    robots_follow: content.robots_follow,
    page_slug: content.page_slug,
    gb5_bo_table: content.gb5_bo_table,
    gb5_wr_id: content.gb5_wr_id,
  })

  const keywords = analyzeKeywords(content.title, displayBody)

  const overallScore = averageScore([
    scores.seo_score,
    scores.aeo_score,
    scores.geo_score,
    scores.content_score,
    scores.citation_score,
    scores.eeat_score,
    scores.readability_score,
  ])

  const baselineOverallScore = averageScore([
    baselineScores.seo_score,
    baselineScores.aeo_score,
    baselineScores.geo_score,
    baselineScores.content_score,
    baselineScores.citation_score,
    baselineScores.eeat_score,
    baselineScores.readability_score,
  ])

  const { data: liveAnalysisData } = await supabaseAdmin
    .from('content_live_analyses')
    .select('*')
    .eq('content_id', id)
    .single()
  const liveAnalysis = liveAnalysisData as LiveAnalysisRecord | null

  const { data: entityAnalysisData } = await supabaseAdmin
    .from('content_entity_analyses')
    .select('*')
    .eq('content_id', id)
    .single()
  const entityAnalysis = entityAnalysisData as EntityAnalysisRecord | null

  const { data: scoreHistoryData } = await supabaseAdmin
    .from('content_score_history')
    .select('*')
    .eq('content_id', id)
    .order('recorded_at', { ascending: true })
    .limit(14)
  const scoreHistory = (scoreHistoryData ?? []) as unknown as ScoreHistoryRecord[]

  const today = new Date().toISOString().slice(0, 10)
  const hasToday = scoreHistory?.some((h) => h.recorded_date === today)
  if (!hasToday) {
    await supabaseAdmin.from('content_score_history').upsert(
      {
        content_id: id,
        recorded_at: new Date().toISOString(),
        recorded_date: today,
        overall_score: overallScore,
        seo_score: scores.seo_score,
        aeo_score: scores.aeo_score,
        geo_score: scores.geo_score,
        content_score: scores.content_score,
        citation_score: scores.citation_score,
        eeat_score: scores.eeat_score,
        readability_score: scores.readability_score,
      },
      { onConflict: 'content_id,recorded_date' }
    ).select()
  }

  const faqItems = Array.isArray(content.faq_json)
    ? (content.faq_json as { question: string; answer: string }[])
    : []

  const liveVerifiedLabel = formatKstDateTime(liveAnalysis?.crawled_at)
  const jsonLdText = JSON.stringify(content.json_ld, null, 2)

  return (
    <>
      {content.json_ld && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(content.json_ld) }}
        />
      )}
      <div className="mx-auto w-full max-w-[1400px] bg-surface px-10 py-10">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="mb-2.5 text-sm font-medium text-accent">콘텐츠 / 상세</p>
            <div className="flex items-center gap-2">
              <h1 className="text-[32px] font-bold tracking-tight text-ink">
                {content.title}
              </h1>
              {content.gb5_bo_table && content.gb5_wr_id && (
                <a
                  href={buildGb5PostUrl(content.gb5_bo_table, content.gb5_wr_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-line px-2 py-1 text-xs text-ink-hint hover:border-accent hover:text-accent"
                  title="그누보드 원본 글을 새 창에서 열기"
                >
                  GB5 원본 보기 ↗
                </a>
              )}
              {content.page_slug && (
                <a
                  href={buildGb5PageUrl(content.page_slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-line px-2 py-1 text-xs text-ink-hint hover:border-accent hover:text-accent"
                  title="고정 페이지를 새 창에서 열기"
                >
                  {content.page_slug} 보기 ↗
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/preview/${id}`}
              className="flex h-10 items-center rounded border border-line px-4 text-sm font-medium text-ink-secondary hover:bg-surface-muted"
            >
              미리보기
            </Link>
            <Link
              href={`/contents/${id}/edit`}
              className="flex h-10 items-center rounded border border-line px-4 text-sm font-medium text-ink-secondary hover:bg-surface-muted"
            >
              수정
            </Link>
            <DeleteButton id={id} />
          </div>
        </div>

        <ContentInsights
          contentId={id}
          seo={{ score: scores.seo_score, breakdown: scores.seo_breakdown }}
          aeo={{ score: scores.aeo_score, breakdown: scores.aeo_breakdown }}
          geo={{ score: scores.geo_score, breakdown: scores.geo_breakdown }}
          dbContent={{ score: scores.content_score, breakdown: scores.content_breakdown }}
          citation={{ score: scores.citation_score, breakdown: scores.citation_breakdown }}
          eeat={{ score: scores.eeat_score, breakdown: scores.eeat_breakdown }}
          readability={{ score: scores.readability_score, breakdown: scores.readability_breakdown }}
          showBreakdown={!!content.seo_title}
          keywords={keywords}
          initialLiveData={liveAnalysis ?? null}
          scoreHistory={scoreHistory ?? []}
          initialEntityData={entityAnalysis ?? null}
        />

        <CompareCard
          myScores={{
            content_score: scores.content_score,
            citation_score: scores.citation_score,
            readability_score: scores.readability_score,
          }}
        />

        <AiOptimizeButton
          id={id}
          title={content.title}
          body={displayBody}
          liveUrl={liveAnalysis?.url ?? liveUrl}
          liveVerifiedAt={liveAnalysis?.crawled_at ?? null}
          optimized={{
            seoTitle: content.seo_title,
            metaDescription: content.meta_description,
            ogTitle: content.og_title,
            ogDescription: content.og_description,
            faqCount: faqItems.length,
            aeAnswer: content.ae_answer,
            geoSummary: content.geo_summary,
            hasJsonLd: !!content.json_ld,
          }}
        />

        <div className="mb-8 whitespace-pre-wrap border-t border-line pt-6 text-[15px] leading-relaxed text-ink">
          {displayBody}
        </div>

        {content.seo_title && (
          <section id="ai-optimization-results" className="border-t border-line pt-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-hint">
                  AI Optimization Result
                </p>
                <h2 className="mt-1 text-[22px] font-black tracking-tight text-ink">
                  생성된 데이터가 CMS에 적용되었습니다.
                </h2>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-[12px] font-bold text-score-good">
                GENERATED · APPLIED ✓
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-black text-ink">SEO Title</p>
                    <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                      GENERATED · APPLIED ✓
                    </span>
                  </div>
                  <p className="text-[15px] leading-6 text-ink">{content.seo_title}</p>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-black text-ink">Meta Description</p>
                    <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                      GENERATED · APPLIED ✓
                    </span>
                  </div>
                  <p className="text-[15px] leading-6 text-ink-secondary">{content.meta_description}</p>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-black text-ink">Open Graph</p>
                    <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                      GENERATED · APPLIED ✓
                    </span>
                  </div>
                  <p className="text-[15px] font-medium text-ink">{content.og_title}</p>
                  <p className="mt-1 text-[14px] leading-6 text-ink-secondary">{content.og_description}</p>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-black text-ink">FAQ</p>
                    <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                      {faqItems.length} ITEMS · APPLIED ✓
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {faqItems.map((faq, i) => (
                      <li key={i}>
                        <p className="font-medium text-ink">Q. {faq.question}</p>
                        <p className="mt-1 text-[14px] leading-6 text-ink-secondary">A. {faq.answer}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-line bg-surface p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[13px] font-black text-ink">AEO Answer</p>
                      <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                        APPLIED ✓
                      </span>
                    </div>
                    <p className="text-[14px] leading-6 text-ink-secondary">{content.ae_answer}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[13px] font-black text-ink">GEO Summary</p>
                      <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                        APPLIED ✓
                      </span>
                    </div>
                    <p className="text-[14px] leading-6 text-ink-secondary">{content.geo_summary}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-line bg-surface-muted p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-black text-ink">Live Page Verification</p>
                      <p className="mt-1 text-[12px] text-ink-hint">
                        실제 페이지 head 출력 기준으로 확인합니다.
                      </p>
                    </div>
                    <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                      {liveAnalysis ? 'VERIFIED ✓' : 'READY'}
                    </span>
                  </div>
                  <pre className="max-h-[360px] overflow-auto rounded-lg bg-ink p-4 text-[12px] leading-5 text-zinc-100">
{`<head>
  <title>${content.seo_title}</title>
  <meta name="description" content="${content.meta_description ?? ''}">
  <meta property="og:title" content="${content.og_title ?? ''}">
  <meta property="og:description" content="${content.og_description ?? ''}">
  <script type="application/ld+json">
${jsonLdText}
  </script>
</head>`}
                  </pre>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-hint">
                    <span>Last verified {liveVerifiedLabel ?? '검증 전'}</span>
                    {liveUrl && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-line bg-surface px-3 py-1.5 font-bold text-ink-secondary hover:text-ink"
                      >
                        Live Page 보기
                      </a>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <p className="mb-4 text-[13px] font-black text-ink">Before / After</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="rounded-lg bg-surface-muted p-4 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-hint">Before</p>
                      <p className="mt-1 text-[42px] font-black leading-none text-ink">{baselineOverallScore}</p>
                      <p className="mt-1 text-[13px] font-bold text-ink-hint">Grade {getGrade(baselineOverallScore)}</p>
                    </div>
                    <span className="text-[24px] font-black text-ink-hint">→</span>
                    <div className="rounded-lg bg-ink p-4 text-center text-white">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-white/55">After</p>
                      <p className="mt-1 text-[42px] font-black leading-none">{overallScore}</p>
                      <p className="mt-1 text-[13px] font-bold text-white/70">
                        Grade {getGrade(overallScore)}
                        {overallScore > baselineOverallScore && (
                          <span className="ml-1 text-emerald-300">+{overallScore - baselineOverallScore}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-[13px]">
                    {[
                      ['AI Citation', baselineScores.citation_score, scores.citation_score],
                      ['Content', baselineScores.content_score, scores.content_score],
                      ['GEO', baselineScores.geo_score, scores.geo_score],
                    ].map(([label, before, after]) => (
                      <div key={label as string} className="flex items-center justify-between rounded bg-surface-muted px-3 py-2">
                        <span className="text-ink-secondary">{label}</span>
                        <span className="font-bold text-ink">
                          {before} → {after}
                          {(after as number) > (before as number) && (
                            <span className="ml-1 text-score-good">+{(after as number) - (before as number)}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-black text-ink">JSON-LD</p>
                    <span className="rounded bg-green-50 px-2 py-1 text-[11px] font-bold text-score-good">
                      VALID · APPLIED ✓
                    </span>
                  </div>
                  <pre className="max-h-[260px] overflow-auto rounded-lg bg-surface-muted p-4 text-xs text-ink-secondary">
                    {jsonLdText}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-line bg-surface p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[13px] font-black uppercase tracking-[0.14em] text-ink-hint">
                  Optimization History
                </p>
                <span className="rounded bg-surface-muted px-2 py-1 text-[11px] font-bold text-ink-secondary">
                  Restore Ready
                </span>
              </div>
              <p className="mb-4 text-[13px] leading-5 text-ink-secondary">
                자동 생성 → 자동 적용 → 검증 → 이력 저장 → 필요 시 이전 버전 복원까지 이어지는 관리 흐름입니다.
              </p>
              <VersionHistory contentId={id} />
            </div>
          </section>
        )}
      </div>
    </>
  )
}
