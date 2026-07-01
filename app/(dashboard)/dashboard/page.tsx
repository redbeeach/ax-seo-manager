import { supabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'
import { calculateScores } from '@/lib/score/calculate'
export const dynamic = 'force-dynamic'

function getGrade(score: number) {
  if (score >= 90) return { grade: 'A+', color: '#22c55e' }
  if (score >= 80) return { grade: 'A',  color: '#22c55e' }
  if (score >= 70) return { grade: 'B',  color: '#eab308' }
  if (score >= 60) return { grade: 'C',  color: '#f97316' }
  if (score >= 50) return { grade: 'D',  color: '#ef4444' }
  return { grade: 'F', color: '#b91c1c' }
}

function tierText(score: number) {
  if (score >= 90) return 'text-score-good'
  if (score >= 70) return 'text-score-mid'
  if (score >= 50) return 'text-score-warn'
  return 'text-score-bad'
}

const TIPS: Record<string, string> = {
  SEO: '메타 태그와 Canonical 설정을 점검하면 개선될 수 있어요.',
  AEO: '질문-답변 형태의 FAQ와 한 줄 요약을 추가하면 개선될 수 있어요.',
  GEO: '최신성 표현(날짜, 업데이트 언급)과 JSON-LD를 보강하면 개선될 수 있어요.',
  Content: 'H2 구조화, 내부링크, 본문 길이를 보완하면 개선될 수 있어요.',
  'AI Citation': 'FAQ, 표, 리스트, 외부 출처 링크를 추가하면 개선될 수 있어요.',
  'E-E-A-T': 'JSON-LD에 author, datePublished, publisher를 추가하면 개선될 수 있어요.',
  Readability: '문장을 짧게 나누고 단락을 3개 이상으로 구성하면 개선될 수 있어요.',
}

export default async function DashboardPage() {
  const { data: contents } = await supabaseAdmin
    .from('contents')
    .select('*')

  const total = contents?.length ?? 0

  // 전체 콘텐츠 calculateScores 실행
  const allScores = (contents ?? []).map((c) =>
    calculateScores({
      title: c.title,
      seo_title: c.seo_title,
      meta_description: c.meta_description,
      og_title: c.og_title,
      og_description: c.og_description,
      faq_json: c.faq_json,
      ae_answer: c.ae_answer,
      geo_summary: c.geo_summary,
      json_ld: c.json_ld,
      body: c.body,
      canonical_url: c.canonical_url,
      robots_index: c.robots_index,
      robots_follow: c.robots_follow,
      page_slug: c.page_slug,
      gb5_bo_table: c.gb5_bo_table,
      gb5_wr_id: c.gb5_wr_id,
    })
  )

  const avgScore = (key: keyof typeof allScores[0]) => {
    if (!total) return 0
    return Math.round(allScores.reduce((sum, s) => sum + (s[key] as number), 0) / total)
  }

  const avgs = {
    seo: avgScore('seo_score'),
    aeo: avgScore('aeo_score'),
    geo: avgScore('geo_score'),
    content: avgScore('content_score'),
    citation: avgScore('citation_score'),
    eeat: avgScore('eeat_score'),
    readability: avgScore('readability_score'),
  }

  const overall = Math.round(
    (avgs.seo + avgs.aeo + avgs.geo + avgs.content + avgs.citation + avgs.eeat + avgs.readability) / 7
  )
  const { grade, color: gradeColor } = getGrade(overall)

  const scoreEntries = [
    { label: 'SEO',         value: avgs.seo },
    { label: 'AEO',         value: avgs.aeo },
    { label: 'GEO',         value: avgs.geo },
    { label: 'Content',     value: avgs.content },
    { label: 'AI Citation', value: avgs.citation },
    { label: 'E-E-A-T',    value: avgs.eeat },
    { label: 'Readability', value: avgs.readability },
  ]

  const lowest = total > 0 ? scoreEntries.reduce((a, b) => (b.value < a.value ? b : a)) : null

  return (
    <div className="mx-auto w-full max-w-[1100px] bg-surface px-8 py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-2.5 text-sm font-medium text-accent">AX SEO Manager</p>
          <h1 className="text-[32px] font-bold tracking-tight text-ink">대시보드</h1>
        </div>
        <Link href="/contents" className="flex items-center gap-1 text-sm font-medium text-ink hover:text-accent">
          콘텐츠 목록 <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mb-7 border-t border-line" />

      {/* Overall + 콘텐츠 수 */}
      <div className="mb-5 flex items-center gap-5 rounded-xl border border-line bg-surface p-6">
        <div className="flex items-end gap-3">
          <span className="text-[56px] font-black leading-none tabular-nums" style={{ color: gradeColor }}>
            {total > 0 ? overall : '—'}
          </span>
          {total > 0 && (
            <span className="mb-1 rounded-lg px-3 py-1 text-[22px] font-black text-white" style={{ backgroundColor: gradeColor }}>
              {grade}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-ink-hint">전체 평균 Overall Score</p>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            콘텐츠 <span className="font-bold text-ink">{total}개</span> 기준
          </p>
          {lowest && total > 0 && (
            <p className="mt-1.5 text-[12px] text-score-bad">
              ↓ 가장 낮은 항목: <span className="font-bold">{lowest.label} {lowest.value}점</span>
            </p>
          )}
        </div>
      </div>

      {/* 7개 점수 카드 */}
      <div className="mb-6 grid grid-cols-4 gap-3 sm:grid-cols-7">
        {scoreEntries.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-3 text-center">
            <p className="mb-1 text-[11px] font-medium text-ink-hint">{s.label}</p>
            <p className={`text-[22px] font-bold tabular-nums ${total > 0 ? tierText(s.value) : 'text-ink-hint'}`}>
              {total > 0 ? s.value : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* 개선 팁 */}
      {lowest && total > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl bg-surface-muted px-5 py-4">
          <span className="text-accent" aria-hidden>ⓘ</span>
          <p className="text-[13px] text-ink-secondary">
            <span className="font-bold text-ink">{lowest.label}</span> 점수가 가장 낮습니다. {TIPS[lowest.label]}
          </p>
        </div>
      )}

      {total === 0 && (
        <p className="mt-16 text-center text-sm text-ink-hint">아직 작성된 콘텐츠가 없습니다.</p>
      )}
    </div>
  )
}