import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import AiOptimizeButton from '@/components/AiOptimizeButton'
import { calculateScores } from '@/lib/score/calculate'
import { buildLiveUrl } from '@/lib/gb5/url'
import { analyzeKeywords } from '@/lib/keywords/analyze'
import VersionHistory from '@/components/VersionHistory'
import ContentInsights from '@/components/ContentInsights'
import CompareCard from '@/components/CompareCard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const { data: content } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

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

  const { data: content, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !content) {
    notFound()
  }

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
    body: content.body,
    canonical_url: content.canonical_url,
    robots_index: content.robots_index,
    robots_follow: content.robots_follow,
    page_slug: content.page_slug,
    gb5_bo_table: content.gb5_bo_table,
    gb5_wr_id: content.gb5_wr_id,
  })

  const keywords = analyzeKeywords(content.title, content.body)

  // 최근 Live 분석 결과 조회
  const { data: liveAnalysis } = await supabaseAdmin
    .from('content_live_analyses')
    .select('*')
    .eq('content_id', id)
    .single()

  // 점수 히스토리 조회 (최근 14개)
  const { data: scoreHistory } = await supabaseAdmin
    .from('content_score_history')
    .select('*')
    .eq('content_id', id)
    .order('recorded_at', { ascending: true })
    .limit(14)

  // 오늘 히스토리 없으면 자동 저장
  const today = new Date().toISOString().slice(0, 10)
  const hasToday = scoreHistory?.some(
    (h) => h.recorded_date === today
  )
  if (!hasToday) {
    const overallScore = Math.round(
      (scores.seo_score + scores.aeo_score + scores.geo_score +
        scores.content_score + scores.citation_score +
        scores.eeat_score + scores.readability_score) / 7
    )
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

  return (
    <>
      {content.json_ld && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(content.json_ld) }}
        />
      )}
      <div className="mx-auto w-full max-w-[1400px] bg-surface px-10 py-10">
        {/* 헤더 */}
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="mb-2.5 text-sm font-medium text-accent">콘텐츠 / 상세</p>
            <div className="flex items-center gap-2">
              <h1 className="text-[32px] font-bold tracking-tight text-ink">
                {content.title}
              </h1>
              {content.gb5_bo_table && content.gb5_wr_id && (
                
                  <a href={`https://hby1126hh.mycafe24.com/g5/bbs/board.php?bo_table=${content.gb5_bo_table}&wr_id=${content.gb5_wr_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-line px-2 py-1 text-xs text-ink-hint hover:border-accent hover:text-accent"
                  title="그누보드 원본 글 새 탭에서 열기"
                >
                  GB5 원본 보기 ↗
                </a>
              )}
              {content.page_slug && (
                
                  <a href={`https://hby1126hh.mycafe24.com/g5${process.env.NEXT_PUBLIC_GB5_SUBPAGE_PATH ?? '/sub'}/${content.page_slug}.php`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-line px-2 py-1 text-xs text-ink-hint hover:border-accent hover:text-accent"
                  title="고정 페이지 새 탭에서 열기"
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

        {/* 점수 카드 + 개선추천 + 브레이크다운 + 키워드 분석 + Entity/Semantic (크롤링 결과 공유) */}
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
        />

        <CompareCard
          myScores={{
            content_score: scores.content_score,
            citation_score: scores.citation_score,
            readability_score: scores.readability_score,
          }}
        />

        <div className="mb-7">
          <AiOptimizeButton id={id} title={content.title} body={content.body} />
        </div>

        <div className="mb-8 whitespace-pre-wrap border-t border-line pt-6 text-[15px] leading-relaxed text-ink">
          {content.body}
        </div>

        {/* AI 최적화 결과 */}
        {content.seo_title && (
          <div className="border-t border-line pt-7">
            <p className="mb-6 text-[17px] font-bold text-ink">AI 최적화 결과</p>

            <div className="grid grid-cols-[160px_1fr] gap-y-6 text-[15px]">
              <p className="text-sm font-medium text-ink-hint">SEO Title</p>
              <p className="text-ink">{content.seo_title}</p>

              <p className="text-sm font-medium text-ink-hint">Meta Description</p>
              <p className="text-ink">{content.meta_description}</p>

              <p className="self-start text-sm font-medium text-ink-hint">
                OG Title / Description
              </p>
              <div>
                <p className="text-ink">{content.og_title}</p>
                <p className="text-ink-secondary">{content.og_description}</p>
              </div>

              <p className="self-start text-sm font-medium text-ink-hint">FAQ</p>
              <ul className="space-y-3">
                {content.faq_json?.map(
                  (faq: { question: string; answer: string }, i: number) => (
                    <li key={i}>
                      <p className="font-medium text-ink">Q. {faq.question}</p>
                      <p className="text-ink-secondary">A. {faq.answer}</p>
                    </li>
                  )
                )}
              </ul>

              <p className="text-sm font-medium text-ink-hint">AEO 한 줄 답변</p>
              <p className="text-ink">{content.ae_answer}</p>

              <p className="text-sm font-medium text-ink-hint">GEO 요약</p>
              <p className="text-ink">{content.geo_summary}</p>

              <p className="self-start text-sm font-medium text-ink-hint">JSON-LD</p>
              <pre className="overflow-x-auto rounded bg-surface-muted p-4 text-xs text-ink-secondary">
                {JSON.stringify(content.json_ld, null, 2)}
              </pre>
            </div>

            {/* 그리드 밖으로 분리 - 2단 그리드 칸에 끼지 않게 */}
            <div className="mt-8">
              <VersionHistory contentId={id} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}