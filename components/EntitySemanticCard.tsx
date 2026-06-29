'use client'

import { useState } from 'react'

interface TermCoverage {
  term: string
  covered: boolean
}

interface EntitySemanticResult {
  entities: string[]
  topic: string
  related_terms_coverage: TermCoverage[]
  covered_count: number
  total_count: number
  coverage_ratio: number
}

export default function EntitySemanticCard({
  contentId,
  liveSource,
}: {
  contentId: string
  liveSource?: { title: string | null; body: string; url: string } | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EntitySemanticResult | null>(null)
  const [analyzedFromLive, setAnalyzedFromLive] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = liveSource
        ? { title: liveSource.title, body: liveSource.body }
        : { id: contentId }

      const res = await fetch('/api/ai/entity-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '분석에 실패했습니다.')
      }

      setResult(data)
      setAnalyzedFromLive(!!liveSource)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const coveragePct = result ? Math.round(result.coverage_ratio * 100) : 0
  const coverageColor =
    coveragePct >= 70 ? 'text-score-good' : coveragePct >= 40 ? 'text-score-mid' : 'text-score-bad'
  const coverageBarColor = coveragePct >= 70 ? '#22c55e' : coveragePct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="mb-8 rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
            🧩 Entity / Semantic 분석
            {result && (
              <span
                className={
                  analyzedFromLive
                    ? 'rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-accent'
                    : 'rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-hint'
                }
              >
                {analyzedFromLive ? '실제 페이지 기준' : 'DB 기준'}
              </span>
            )}
          </p>
          <p className="text-[12px] text-ink-hint">
            {liveSource
              ? '실제 크롤링된 페이지 본문 기준으로 분석합니다.'
              : '본문에서 핵심 개체를 추출하고, 주제 관련 단어가 얼마나 포함됐는지 확인합니다. (먼저 위에서 실제 페이지를 크롤링하면 그 결과를 기준으로 분석합니다)'}
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="h-9 shrink-0 rounded bg-accent px-4 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? '분석 중...' : result ? '다시 분석' : 'AI 분석 실행'}
        </button>
      </div>

      {error && (
        <p className="rounded bg-surface-muted px-3 py-2 text-[13px] font-medium text-score-bad">
          {error}
        </p>
      )}

      {result && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-medium text-ink-hint">추출된 Entity</p>
            <div className="flex flex-wrap gap-1.5">
              {result.entities.length > 0 ? (
                result.entities.map((e) => (
                  <span
                    key={e}
                    className="rounded bg-surface-muted px-2 py-0.5 text-[12px] text-ink"
                  >
                    {e}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-ink-hint">추출된 Entity 없음</span>
              )}
            </div>

            <p className="mt-4 mb-1 text-[12px] font-medium text-ink-hint">핵심 주제</p>
            <p className="text-[15px] font-bold text-ink">{result.topic || '판단 불가'}</p>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[12px] font-medium text-ink-hint">
                주제 관련 단어 포함률 ({result.covered_count}/{result.total_count})
              </p>
              <span className={`text-[15px] font-bold ${coverageColor}`}>{coveragePct}%</span>
            </div>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${coveragePct}%`, backgroundColor: coverageBarColor }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {result.related_terms_coverage.map((c) => (
                <span
                  key={c.term}
                  className={
                    c.covered
                      ? 'rounded border border-line px-2 py-0.5 text-[12px] text-ink-secondary'
                      : 'rounded border border-score-bad px-2 py-0.5 text-[12px] text-score-bad'
                  }
                >
                  {c.covered ? '✓' : '✗'} {c.term}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}