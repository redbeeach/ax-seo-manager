'use client'

import { useState } from 'react'

type EntityType = 'Person' | 'Organization' | 'Location' | 'Technology' | 'Product' | 'Event' | 'Other'

interface EntityItem {
  name: string
  type: EntityType
}

interface TermCoverage {
  term: string
  reason: string
  covered: boolean
}

interface EntitySemanticResult {
  entities: EntityItem[]
  topic: string
  related_terms_coverage: TermCoverage[]
  covered_count: number
  total_count: number
  coverage_ratio: number
}

const ENTITY_META: Record<EntityType, { emoji: string; label: string; bg: string }> = {
  Person:       { emoji: '👤', label: '인물',  bg: '#EEF2FF' },
  Organization: { emoji: '🏢', label: '조직',  bg: '#F0FDF4' },
  Location:     { emoji: '📍', label: '장소',  bg: '#FFF7ED' },
  Technology:   { emoji: '💻', label: '기술',  bg: '#F0F9FF' },
  Product:      { emoji: '📦', label: '제품',  bg: '#FDF4FF' },
  Event:        { emoji: '📅', label: '이벤트', bg: '#FFFBEB' },
  Other:        { emoji: '🔹', label: '기타',  bg: '#F9FAFB' },
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
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null)

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

      if (!res.ok) throw new Error(data.error || '분석에 실패했습니다.')

      setResult(data)
      setAnalyzedFromLive(!!liveSource)
      setAnalyzedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const coveragePct = result ? Math.round(result.coverage_ratio * 100) : 0
  const coverageColor =
    coveragePct >= 70 ? 'text-score-good' : coveragePct >= 40 ? 'text-score-mid' : 'text-score-bad'
  const coverageBarColor = coveragePct >= 70 ? '#22c55e' : coveragePct >= 40 ? '#eab308' : '#ef4444'

  return (
    <div className="mb-8 rounded-xl border border-line bg-surface p-5">
      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between">
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
              ? '크롤링된 실제 페이지 기준으로 분석합니다.'
              : '룰베이스(H태그/TF) + AI로 Entity를 추출하고 Semantic 커버리지를 측정합니다. 크롤링 후 분석하면 더 정확합니다.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="h-9 shrink-0 rounded bg-accent px-4 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? '분석 중...' : result ? '다시 분석' : 'AI 분석 실행'}
          </button>
          {analyzedAt && (
            <p className="text-[11px] text-ink-hint">
              마지막 분석{' '}
              {analyzedAt.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded bg-surface-muted px-3 py-2 text-[13px] font-medium text-score-bad">
          {error}
        </p>
      )}

      {result && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Entity */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-ink-hint">핵심 주제</p>
            <p className="mb-3 text-[15px] font-bold text-ink">{result.topic || '판단 불가'}</p>

            <p className="mb-2 text-[12px] font-medium text-ink-hint">추출된 Entity</p>
            {result.entities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {result.entities.map((e,i) => {
                  const meta = ENTITY_META[e.type] ?? ENTITY_META.Other
                  return (
                    <span
                      key={`${e.name}-${i}`}
                      className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[12px] font-medium text-ink"
                      style={{ backgroundColor: meta.bg }}
                      title={meta.label}
                    >
                      {meta.emoji} {e.name}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12px] text-ink-hint">추출된 Entity 없음</p>
            )}

            {/* 유형 범례 */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.entries(ENTITY_META) as [EntityType, typeof ENTITY_META[EntityType]][])
                .filter(([type]) => result.entities.some((e) => e.type === type))
                .map(([type, meta]) => (
                  <span key={type} className="text-[11px] text-ink-hint">
                    {meta.emoji} {meta.label}
                  </span>
                ))}
            </div>
          </div>

          {/* Semantic */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[12px] font-medium text-ink-hint">
                주제 관련 키워드 포함률 ({result.covered_count}/{result.total_count})
              </p>
              <span className={`text-[15px] font-bold ${coverageColor}`}>{coveragePct}%</span>
            </div>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${coveragePct}%`, backgroundColor: coverageBarColor }}
              />
            </div>

            <div className="space-y-1.5">
              {result.related_terms_coverage.map((c) => (
                <div
                  key={c.term}
                  className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-[12px] ${
                    c.covered
                      ? 'border-line bg-surface-muted text-ink-secondary'
                      : 'border-score-bad/30 bg-red-50 text-score-bad'
                  }`}
                >
                  <span className="font-medium">
                    {c.covered ? '✓' : '✗'} {c.term}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-hint">{c.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}