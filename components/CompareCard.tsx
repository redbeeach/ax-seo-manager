'use client'

import { useState } from 'react'

interface CompareResult {
  url: string
  label: string
  content_score: number
  citation_score: number
  readability_score: number
  error?: string
}

interface MyScores {
  content_score: number
  citation_score: number
  readability_score: number
}

interface CompareCardProps {
  myScores: MyScores
  myLabel?: string
}

const SCORE_LABELS = [
  { key: 'content_score' as const, label: 'Content' },
  { key: 'citation_score' as const, label: 'AI Citation' },
  { key: 'readability_score' as const, label: 'Readability' },
]

function tierFill(ratio: number) {
  if (ratio >= 0.9) return '#22c55e'
  if (ratio >= 0.7) return '#eab308'
  if (ratio >= 0.5) return '#f97316'
  return '#ef4444'
}

function tierText(ratio: number) {
  if (ratio >= 0.9) return 'text-score-good'
  if (ratio >= 0.7) return 'text-score-mid'
  if (ratio >= 0.5) return 'text-score-warn'
  return 'text-score-bad'
}

function ScoreBar({ score, highlight }: { score: number; highlight?: boolean }) {
  const ratio = score / 100
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-1.5 w-20 overflow-hidden rounded-full`}
        style={{ backgroundColor: '#E5E7EB' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, score)}%`, backgroundColor: tierFill(ratio) }}
        />
      </div>
      <span className={`text-[13px] font-bold tabular-nums ${highlight ? tierText(ratio) : tierText(ratio)}`}>
        {score}
      </span>
    </div>
  )
}

export default function CompareCard({ myScores, myLabel = '내 페이지' }: CompareCardProps) {
  const [competitors, setCompetitors] = useState([
    { url: '', label: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<CompareResult[] | null>(null)

  const addCompetitor = () => {
    if (competitors.length < 3) {
      setCompetitors([...competitors, { url: '', label: '' }])
    }
  }

  const removeCompetitor = (i: number) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i))
  }

  const updateCompetitor = (i: number, field: 'url' | 'label', value: string) => {
    setCompetitors(competitors.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  const handleCompare = async () => {
    const valid = competitors.filter((c) => c.url.trim())
    if (valid.length === 0) {
      setError('URL을 1개 이상 입력하세요.')
      return
    }

    // 유효한 URL 검사
    const invalid = valid.find((c) => !/^https?:\/\/.+/i.test(c.url.trim()))
    if (invalid) {
      setError(`올바른 URL이 아닙니다: ${invalid.url}`)
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitors: valid.map((c) => ({
            url: c.url.trim(),
            label: c.label.trim() || new URL(c.url.trim()).hostname,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '비교 실패')

      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  // 내 페이지를 포함한 전체 행 데이터
  const allRows: (CompareResult & { isMe?: boolean })[] = [
    {
      url: '',
      label: myLabel,
      content_score: myScores.content_score,
      citation_score: myScores.citation_score,
      readability_score: myScores.readability_score,
      isMe: true,
    },
    ...(results ?? []),
  ]

  return (
    <div className="mb-8 rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold text-ink">⚔️ 경쟁 페이지 비교</p>
          <p className="text-[12px] text-ink-hint">
            비교할 경쟁 URL을 입력하면 Content/Citation/Readability 점수를 나란히 보여줍니다. (최대 3개)
          </p>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading}
          className="h-9 shrink-0 rounded bg-accent px-4 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? '분석 중...' : results ? '다시 비교' : '비교 분석'}
        </button>
      </div>

      {/* URL 입력 필드 */}
      <div className="mb-4 space-y-2">
        {competitors.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={c.label}
              onChange={(e) => updateCompetitor(i, 'label', e.target.value)}
              placeholder="라벨 (예: 나무위키)"
              className="h-9 w-28 shrink-0 rounded border border-line px-2 text-[13px] text-ink outline-none focus:border-accent"
            />
            <input
              type="text"
              value={c.url}
              onChange={(e) => updateCompetitor(i, 'url', e.target.value)}
              placeholder="https://..."
              className="h-9 flex-1 rounded border border-line px-3 text-[13px] text-ink outline-none focus:border-accent"
            />
            {competitors.length > 1 && (
              <button
                onClick={() => removeCompetitor(i)}
                className="h-9 w-9 shrink-0 rounded border border-line text-[13px] text-ink-hint hover:border-score-bad hover:text-score-bad"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {competitors.length < 3 && (
          <button
            onClick={addCompetitor}
            className="text-[12px] text-accent hover:underline"
          >
            + URL 추가
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded bg-surface-muted px-3 py-2 text-[13px] font-medium text-score-bad">
          {error}
        </p>
      )}

      {/* 비교 테이블 */}
      {results && (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-left font-medium text-ink-hint">페이지</th>
                {SCORE_LABELS.map((s) => (
                  <th key={s.key} className="pb-2 text-left font-medium text-ink-hint">
                    {s.label}
                  </th>
                ))}
                <th className="pb-2 text-left font-medium text-ink-hint">평균</th>
                <th className="pb-2 text-left font-medium text-ink-hint">Gap</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((row, i) => {
                const avg = Math.round(
                  (row.content_score + row.citation_score + row.readability_score) / 3
                )
                const myAvg = Math.round(
                  (myScores.content_score + myScores.citation_score + myScores.readability_score) / 3
                )
                const avgGap = row.isMe ? null : avg - myAvg

                return (
                  <tr
                    key={i}
                    className={`border-b border-line last:border-0 ${row.isMe ? 'bg-surface-muted' : ''}`}
                  >
                    <td className="py-2.5 pr-4">
                      <p className={`font-medium ${row.isMe ? 'text-accent' : 'text-ink'}`}>
                        {row.isMe && '★ '}{row.label}
                      </p>
                      {!row.isMe && (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block max-w-[200px] truncate text-[11px] text-ink-hint hover:underline"
                        >
                          {row.url}
                        </a>
                      )}
                      {row.error && (
                        <p className="text-[11px] text-score-bad">{row.error}</p>
                      )}
                    </td>
                    {SCORE_LABELS.map((s) => {
                      const score = row[s.key]
                      const myScore = myScores[s.key]
                      const diff = row.isMe ? null : score - myScore
                      return (
                        <td key={s.key} className="py-2.5 pr-6">
                          <ScoreBar score={score} />
                          {diff !== null && !row.error && (
                            <p className={`mt-0.5 text-[11px] font-bold ${diff > 0 ? 'text-score-bad' : diff < 0 ? 'text-score-good' : 'text-ink-hint'}`}>
                              {diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : '='}
                            </p>
                          )}
                        </td>
                      )
                    })}
                    <td className="py-2.5 pr-4">
                      <span className={`text-[14px] font-bold ${tierText(avg / 100)}`}>{avg}</span>
                    </td>
                    <td className="py-2.5">
                      {avgGap !== null && !row.error ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${
                            avgGap > 0
                              ? 'bg-red-50 text-score-bad'
                              : avgGap < 0
                              ? 'bg-green-50 text-score-good'
                              : 'bg-surface-muted text-ink-hint'
                          }`}
                        >
                          {avgGap > 0 ? `+${avgGap}` : avgGap < 0 ? `${avgGap}` : '동점'}
                        </span>
                      ) : row.isMe ? (
                        <span className="text-[12px] text-ink-hint">기준</span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}