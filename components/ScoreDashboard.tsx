'use client'

import { useState } from 'react'
import Tooltip from '@/components/Tooltip'
import { getTip } from '@/lib/score/breakdown-tips'

interface ScoreBreakdownItem {
  label: string
  points: number
  maxPoints: number
  passed: boolean
}

interface ScoreGroup {
  score: number
  breakdown: ScoreBreakdownItem[]
}

interface KeywordData {
  primary: string[]
  secondary: { word: string; count: number }[]
  missing: string[]
}

interface CrawlApiResult {
  url: string
  crawled_at: string
  page_title: string | null
  title: string | null
  body: string
  content_score: number
  content_breakdown: ScoreBreakdownItem[]
}

interface ScoreDashboardProps {
  contentId: string
  seo: ScoreGroup
  aeo: ScoreGroup
  geo: ScoreGroup
  dbContent: ScoreGroup
  citation: ScoreGroup
  eeat: ScoreGroup
  showBreakdown: boolean
  keywords: KeywordData
  onCrawlResult?: (result: { title: string | null; body: string; url: string } | null) => void
}

function tierFill(ratio: number) {
  if (ratio >= 0.9) return '#22c55e'  // 90+ 초록
  if (ratio >= 0.7) return '#eab308'  // 70+ 노랑
  if (ratio >= 0.5) return '#f97316'  // 50+ 주황
  return '#ef4444'                    // ~49 빨강
}

function tierText(ratio: number) {
  if (ratio >= 0.9) return 'text-score-good'
  if (ratio >= 0.7) return 'text-score-mid'
  if (ratio >= 0.5) return 'text-score-warn'
  return 'text-score-bad'
}

function projectedScore(group: { score: number; items: ScoreBreakdownItem[] }): number {
  const recoverable = group.items.filter((i) => !i.passed).reduce((sum, i) => sum + i.maxPoints, 0)
  return Math.min(100, group.score + recoverable)
}

export default function ScoreDashboard({
  contentId,
  seo,
  aeo,
  geo,
  dbContent,
  citation,
  eeat,
  showBreakdown,
  keywords,
  onCrawlResult,
}: ScoreDashboardProps) {
  const [crawlLoading, setCrawlLoading] = useState(false)
  const [crawlError, setCrawlError] = useState<string | null>(null)
  const [crawlResult, setCrawlResult] = useState<CrawlApiResult | null>(null)

  // 크롤링 결과가 있으면 그걸 우선 사용, 없으면 DB 기준 점수 사용
  const content: ScoreGroup = crawlResult
    ? { score: crawlResult.content_score, breakdown: crawlResult.content_breakdown }
    : dbContent

  const handleCrawl = async () => {
    setCrawlLoading(true)
    setCrawlError(null)
    try {
      const res = await fetch(`/api/contents/${contentId}/crawl`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '크롤링에 실패했습니다.')
      }

      setCrawlResult(data)
      onCrawlResult?.({ title: data.title, body: data.body, url: data.url })
    } catch (err) {
      setCrawlError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setCrawlLoading(false)
    }
  }

  const scoreCards = [
    { label: 'SEO', score: seo.score, items: seo.breakdown },
    { label: 'AEO', score: aeo.score, items: aeo.breakdown },
    { label: 'GEO', score: geo.score, items: geo.breakdown },
    { label: 'Content', score: content.score, items: content.breakdown },
    { label: 'AI Citation', score: citation.score, items: citation.breakdown },
    { label: 'E-E-A-T', score: eeat.score, items: eeat.breakdown },
  ]

  const recommendations = scoreCards.flatMap((group) =>
    group.items
      .filter((item) => !item.passed)
      .map((item) => ({
        group: group.label,
        label: item.label,
        gainPoints: item.maxPoints,
      }))
  )

  const totalCurrent = scoreCards.reduce((sum, g) => sum + g.score, 0)
  const totalProjected = scoreCards.reduce((sum, g) => sum + projectedScore(g), 0)
  const avgCurrent = Math.round(totalCurrent / scoreCards.length)
  const avgProjected = Math.round(totalProjected / scoreCards.length)

  return (
    <div className="mb-8 border-t border-line pt-6">
      {/* 점수 카드 5단 */}
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {scoreCards.map((group) => {
          const ratio = group.score / 100
          const widthPct = Math.min(100, Math.round(ratio * 100))
          const isContentCard = group.label === 'Content'
          const projected = projectedScore(group)

          return (
            <div key={group.label} className="rounded-xl border border-line bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-hint">
                  {group.label}
                </p>
                {isContentCard && crawlResult && (
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    실시간
                  </span>
                )}
                {isContentCard && !crawlResult && (
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-hint">
                    DB 기준
                  </span>
                )}
              </div>
              <p className="mb-1 text-[28px] font-bold leading-none tabular-nums">
                <span className={tierText(ratio)}>{group.score}</span>
                <span className="text-[14px] font-normal text-ink-hint"> /100</span>
              </p>
              {projected > group.score && (
                <p className="mb-2 text-[11px] text-ink-hint">
                  전부 수정 시 <span className="font-medium text-accent">{projected}점</span> 예상
                </p>
              )}
              <div
                className={`w-full overflow-hidden rounded-full ${projected > group.score ? 'mt-1' : 'mt-3'} h-1.5`}
                style={{ backgroundColor: '#E5E7EB' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${widthPct}%`, backgroundColor: tierFill(ratio) }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 실제 페이지 크롤링 트리거 */}
      <div className="mb-5 flex items-center justify-between rounded-lg bg-surface-muted px-4 py-2.5">
        <p className="text-[12px] text-ink-hint">
          {crawlResult ? (
            <>
              <a
                href={crawlResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {crawlResult.url} ↗
              </a>
              {' · '}
              {new Date(crawlResult.crawled_at).toLocaleString('ko-KR')} 기준 실제 페이지 검사 결과로 Content 점수가 갱신됨
            </>
          ) : (
            '아직 DB에 저장된 데이터로만 검사된 상태입니다. 실제 배포된 페이지를 직접 가져와서 검사하려면 크롤링을 실행하세요.'
          )}
        </p>
        <button
          onClick={handleCrawl}
          disabled={crawlLoading}
          className="h-8 shrink-0 rounded bg-accent px-3 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {crawlLoading ? '크롤링 중...' : crawlResult ? '다시 크롤링' : '🌐 실제 페이지 크롤링'}
        </button>
      </div>

      {crawlError && (
        <p className="mb-5 rounded bg-surface-muted px-3 py-2 text-[13px] font-medium text-score-bad">
          {crawlError}
        </p>
      )}

      {/* 개선 추천 */}
      <div className="mb-8 rounded-xl border border-line bg-surface-muted p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-bold text-ink">🔥 개선 추천</p>
          {recommendations.length > 0 && (
            <p className="text-[12px] text-ink-hint">
              현재 평균 <span className="font-bold text-ink">{avgCurrent}점</span>
              {' → '}
              모두 수정 시 예상{' '}
              <span className="font-bold text-accent">{avgProjected}점</span>
            </p>
          )}
        </div>
        {recommendations.length === 0 ? (
          <p className="text-[13px] text-score-good">감점 항목 없음 — 완벽해요</p>
        ) : (
          <ol className="grid grid-cols-1 gap-2 text-[13px] lg:grid-cols-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <span className="mt-0.5 shrink-0 text-ink-hint">{i + 1}.</span>
                <span className="text-ink-secondary">
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink">
                    {rec.group}
                  </span>{' '}
                  {rec.label}
                  <span className="text-score-good"> (예상 +{rec.gainPoints}pt)</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 5단 브레이크다운 + 키워드 분석 */}
      {showBreakdown && (
        <div className="grid grid-cols-2 gap-6 border-t border-line pt-6 md:grid-cols-3 lg:grid-cols-7">
          {scoreCards.map((col) => (
            <div key={col.label}>
              <p className="mb-3 text-[15px] font-bold text-ink">
                {col.label}{' '}
                <span className={tierText(col.score / 100)}>{col.score}점</span>
              </p>
              <ul className="space-y-1.5 text-[13px]">
                {col.items.map((item, i) => {
                  const tip = getTip(item.label)
                  const text = (
                    <span>
                      {item.passed ? '✓' : '✗'} {item.label} ({item.passed ? '+' : '-'}
                      {item.maxPoints}pt)
                      {tip && (
                        <span className="ml-1 cursor-help text-ink-hint">ⓘ</span>
                      )}
                    </span>
                  )
                  return (
                    <li key={i} className={item.passed ? 'text-ink-secondary' : 'text-score-bad'}>
                      {tip ? <Tooltip text={tip}>{text}</Tooltip> : text}
                    </li>
                  )
                })}
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
                  <span key={w} className="rounded bg-surface-muted px-2 py-0.5 text-[12px] text-ink">
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
    </div>
  )
}