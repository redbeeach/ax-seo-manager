import { supabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'

function scoreColorClass(score: number) {
  if (score >= 80) return 'text-score-good'
  if (score >= 50) return 'text-score-mid'
  return 'text-score-bad'
}

export default async function DashboardPage() {
  const { data: contents } = await supabaseAdmin
    .from('contents')
    .select('seo_score, aeo_score, geo_score')

  const total = contents?.length ?? 0

  const avg = (key: 'seo_score' | 'aeo_score' | 'geo_score') => {
    if (!total) return 0
    const sum = contents!.reduce((acc, c) => acc + (c[key] ?? 0), 0)
    return Math.round(sum / total)
  }

  const seoAvg = avg('seo_score')
  const aeoAvg = avg('aeo_score')
  const geoAvg = avg('geo_score')

  const stats = [
    { label: '전체 콘텐츠 수', value: total, isScore: false },
    { label: '평균 SEO 점수', value: seoAvg, isScore: true },
    { label: '평균 AEO 점수', value: aeoAvg, isScore: true },
    { label: '평균 GEO 점수', value: geoAvg, isScore: true },
  ]

  // 세 점수 중 가장 낮은 항목 찾아서 안내 문구 표시
  const scoreEntries = [
    { label: 'SEO', value: seoAvg },
    { label: 'AEO', value: aeoAvg },
    { label: 'GEO', value: geoAvg },
  ]
  const lowest = total > 0 ? scoreEntries.reduce((a, b) => (b.value < a.value ? b : a)) : null

  const tipByLabel: Record<string, string> = {
    SEO: '핵심 키워드 밀도와 메타 설명 길이를 점검해보면 개선될 수 있어요.',
    AEO: '질문-답변 형태의 명확한 한 줄 요약을 추가하면 개선될 수 있어요.',
    GEO: '최신성 표현(날짜, 업데이트 언급)을 보강하면 개선될 수 있어요.',
  }

  return (
    <div className="mx-auto max-w-3xl bg-surface px-8 py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-2.5 text-sm font-medium text-accent">AX SEO Manager</p>
          <h1 className="text-[32px] font-bold tracking-tight text-ink">대시보드</h1>
        </div>
        <Link
          href="/contents"
          className="flex items-center gap-1 text-sm font-medium text-ink hover:text-accent"
        >
          콘텐츠 목록 <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mb-7 border-t border-line" />

      <div className="grid grid-cols-4 overflow-hidden rounded border border-line">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`p-5 ${i < stats.length - 1 ? 'border-r border-line' : ''}`}
          >
            <p className="mb-2.5 text-[13px] text-ink-hint">{s.label}</p>
            <p
              className={`text-[28px] font-bold ${
                s.isScore ? scoreColorClass(s.value) : 'text-ink'
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {lowest && total > 0 && (
        <div className="mt-7 flex items-center gap-2.5 rounded bg-surface-muted px-5 py-4">
          <span className="text-accent" aria-hidden>
            ⓘ
          </span>
          <p className="text-[13px] text-ink-secondary">
            {lowest.label} 점수가 다른 항목보다 낮습니다. {tipByLabel[lowest.label]}
          </p>
        </div>
      )}
    </div>
  )
}