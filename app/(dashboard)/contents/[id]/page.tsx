import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import AiOptimizeButton from '@/components/AiOptimizeButton'
import { calculateScores } from '@/lib/score/calculate'
import { analyzeKeywords } from '@/lib/keywords/analyze'

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

  return {
    title: content.seo_title || content.title,
    description: content.meta_description || undefined,
    openGraph: {
      title: content.og_title || content.title,
      description: content.og_description || undefined,
    },
  }
}

function scoreColorClass(score: number) {
  if (score >= 80) return 'text-score-good'
  if (score >= 50) return 'text-score-mid'
  return 'text-score-bad'
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
    seo_title: content.seo_title,
    meta_description: content.meta_description,
    og_title: content.og_title,
    og_description: content.og_description,
    faq_json: content.faq_json,
    ae_answer: content.ae_answer,
    geo_summary: content.geo_summary,
    json_ld: content.json_ld,
  })

  const breakdownColumns = [
    { label: 'SEO', score: scores.seo_score, items: scores.seo_breakdown },
    { label: 'AEO', score: scores.aeo_score, items: scores.aeo_breakdown },
    { label: 'GEO', score: scores.geo_score, items: scores.geo_breakdown },
  ]

  const keywords = analyzeKeywords(content.title, content.body)

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
                <a
                  href={`https://hby1126hh.mycafe24.com/g5/bbs/board.php?bo_table=${content.gb5_bo_table}&wr_id=${content.gb5_wr_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-line px-2 py-1 text-xs text-ink-hint hover:border-accent hover:text-accent"
                  title="그누보드 원본 글 새 탭에서 열기"
                >
                  GB5 원본 보기 ↗
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

        <p className="mb-6 flex gap-3 text-[13px] text-ink-hint">
          <span>
            SEO <span className={`font-medium ${scoreColorClass(content.seo_score)}`}>{content.seo_score}</span>
          </span>
          <span aria-hidden>·</span>
          <span>
            AEO <span className={`font-medium ${scoreColorClass(content.aeo_score)}`}>{content.aeo_score}</span>
          </span>
          <span aria-hidden>·</span>
          <span>
            GEO <span className={`font-medium ${scoreColorClass(content.geo_score)}`}>{content.geo_score}</span>
          </span>
        </p>

        <div className="mb-7">
          <AiOptimizeButton id={id} title={content.title} body={content.body} />
        </div>

        {/* 점수 브레이크다운 3단 */}
        {content.seo_title && (
          <div className="mb-8 grid grid-cols-4 gap-8 border-t border-line pt-6">
            {breakdownColumns.map((col) => (
              <div key={col.label}>
                <p className="mb-3 text-[15px] font-bold text-ink">
                  {col.label}{' '}
                  <span className={scoreColorClass(col.score)}>{col.score}점</span>
                </p>
                <ul className="space-y-1.5 text-[13px]">
                  {col.items.map((item, i) => (
                    <li
                      key={i}
                      className={item.passed ? 'text-ink-secondary' : 'text-score-bad'}
                    >
                      {item.passed ? '✓' : '✗'} {item.label} ({item.points}pt)
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* 키워드 분석 */}
            <div>
              <p className="mb-3 text-[15px] font-bold text-ink">키워드 분석</p>

              <p className="mb-1 text-[12px] font-medium text-ink-hint">주요 키워드</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {keywords.primary.length > 0 ? (
                  keywords.primary.map((w) => (
                    <span
                      key={w}
                      className="rounded bg-surface-muted px-2 py-0.5 text-[12px] text-ink"
                    >
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-ink-hint">제목에서 추출된 키워드 없음</span>
                )}
              </div>

              <p className="mb-1 text-[12px] font-medium text-ink-hint">보조 키워드</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {keywords.secondary.length > 0 ? (
                  keywords.secondary.map((k) => (
                    <span
                      key={k.word}
                      className="rounded border border-line px-2 py-0.5 text-[12px] text-ink-secondary"
                    >
                      {k.word} ({k.count})
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-ink-hint">반복되는 보조 키워드 없음</span>
                )}
              </div>

              <p className="mb-1 text-[12px] font-medium text-ink-hint">누락 키워드</p>
              <div className="flex flex-wrap gap-1.5">
                {keywords.missing.length > 0 ? (
                  keywords.missing.map((w) => (
                    <span
                      key={w}
                      className="rounded border border-score-bad px-2 py-0.5 text-[12px] text-score-bad"
                    >
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-score-good">제목 키워드가 본문에 모두 포함됨</span>
                )}
              </div>
            </div>
          </div>
        )}

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
          </div>
        )}
      </div>
    </>
  )
}