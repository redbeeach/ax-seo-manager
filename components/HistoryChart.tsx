'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface HistoryRecord {
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

interface HistoryChartProps {
  history: HistoryRecord[]
}

const METRICS = [
  { key: 'overall_score',     label: 'Overall',     color: '#4F46E5' },
  { key: 'seo_score',         label: 'SEO',         color: '#22c55e' },
  { key: 'aeo_score',         label: 'AEO',         color: '#eab308' },
  { key: 'geo_score',         label: 'GEO',         color: '#f97316' },
  { key: 'content_score',     label: 'Content',     color: '#06b6d4' },
  { key: 'citation_score',    label: 'AI Citation', color: '#8b5cf6' },
  { key: 'eeat_score',        label: 'E-E-A-T',     color: '#ec4899' },
  { key: 'readability_score', label: 'Readability', color: '#14b8a6' },
] as const

export default function HistoryChart({ history }: HistoryChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<string[]>(['overall_score'])

  if (!history || history.length < 2) {
    return (
      <div className="mb-8 rounded-xl border border-line bg-surface p-5">
        <p className="mb-1 text-[14px] font-bold text-ink">📈 점수 변화 히스토리</p>
        <p className="text-[13px] text-ink-hint">
          방문할 때마다 하루 1회 자동 기록됩니다. 2일 이상 데이터가 쌓이면 그래프가 표시됩니다.
        </p>
      </div>
    )
  }

  const chartData = history.map((h) => ({
    date: new Date(h.recorded_date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    overall_score: h.overall_score ?? 0,
    seo_score: h.seo_score ?? 0,
    aeo_score: h.aeo_score ?? 0,
    geo_score: h.geo_score ?? 0,
    content_score: h.content_score ?? 0,
    citation_score: h.citation_score ?? 0,
    eeat_score: h.eeat_score ?? 0,
    readability_score: h.readability_score ?? 0,
  }))

  // 최신 vs 첫 기록 변화량
  const first = history[0]
  const last = history[history.length - 1]
  const overallDiff = (last.overall_score ?? 0) - (first.overall_score ?? 0)

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  return (
    <div className="mb-8 rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold text-ink">📈 점수 변화 히스토리</p>
          <p className="text-[12px] text-ink-hint">방문일 기준 하루 1회 자동 기록</p>
        </div>
        {overallDiff !== 0 && (
          <div className="text-right">
            <p className="text-[12px] text-ink-hint">첫 기록 대비 Overall</p>
            <p className={`text-[18px] font-bold ${overallDiff > 0 ? 'text-score-good' : 'text-score-bad'}`}>
              {overallDiff > 0 ? `+${overallDiff}` : overallDiff}점
            </p>
          </div>
        )}
      </div>

      {/* 메트릭 선택 토글 */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
              activeMetrics.includes(m.key)
                ? 'text-white'
                : 'bg-surface-muted text-ink-hint'
            }`}
            style={activeMetrics.includes(m.key) ? { backgroundColor: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#71717A' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E4E4E7' }}
          />
          {METRICS.filter((m) => activeMetrics.includes(m.key)).map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={m.key === 'overall_score' ? 2.5 : 1.5}
              dot={{ r: 3, fill: m.color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}