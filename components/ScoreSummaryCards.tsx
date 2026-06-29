interface ScoreBreakdownItem {
  label: string
  points: number
  passed: boolean
}

interface ScoreSummaryCardsProps {
  scores: {
    label: string
    score: number
    maxScore: number
    items: ScoreBreakdownItem[]
  }[]
}

const TIER = {
  good: { fill: '#22c55e', text: 'text-score-good' },
  mid: { fill: '#f59e0b', text: 'text-score-mid' },
  bad: { fill: '#ef4444', text: 'text-score-bad' },
}

function tierOf(ratio: number) {
  if (ratio >= 0.8) return TIER.good
  if (ratio >= 0.5) return TIER.mid
  return TIER.bad
}

export default function ScoreSummaryCards({ scores }: ScoreSummaryCardsProps) {
  const recommendations = scores.flatMap((group) =>
    group.items
      .filter((item) => !item.passed)
      .map((item) => ({
        group: group.label,
        label: item.label,
        lostPoints: item.points > 0 ? item.points : 0,
      }))
  )

  return (
    <div className="mb-8 border-t border-line pt-6">
      {/* 점수 카드 4단 */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {scores.map((group) => {
          const ratio = group.maxScore > 0 ? group.score / group.maxScore : 0
          const tier = tierOf(ratio)
          const widthPct = Math.min(100, Math.round(ratio * 100))

          return (
            <div key={group.label} className="rounded-xl border border-line bg-surface p-4">
              <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-hint">
                {group.label}
              </p>
              <p className="mb-3 text-[28px] font-bold leading-none tabular-nums">
                <span className={tier.text}>{group.score}</span>
                <span className="text-[14px] font-normal text-ink-hint"> /{group.maxScore}</span>
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${widthPct}%`, backgroundColor: tier.fill }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 개선 추천 */}
      <div className="rounded-xl border border-line bg-surface-muted p-4">
        <p className="mb-3 text-[14px] font-bold text-ink">🔥 개선 추천</p>
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
                  {rec.lostPoints > 0 && <span className="text-score-bad"> (-{rec.lostPoints}pt)</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}