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

function ScorePill({ label, score }: { label: string; score: number }) {
  return (
    <span className="flex items-center gap-1 text-[12px]">
      <span className="text-ink-hint">{label}</span>
      <span className={`font-bold tabular-nums ${tierText(score)}`}>{score}</span>
    </span>
  )
}

export default async function ContentsListPage() {
  const { data: contents, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto w-full max-w-[1200px] bg-surface px-8 py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-2.5 text-sm font-medium text-accent">AX SEO Manager</p>
          <h1 className="text-[32px] font-bold tracking-tight text-ink">콘텐츠 목록</h1>
        </div>
        <Link
          href="/contents/new"
          className="flex h-11 items-center rounded bg-accent px-6 text-sm font-bold text-white hover:bg-accent-hover"
        >
          + 새 글
        </Link>
      </div>

      <div className="mb-6 border-t border-line" />

      {error && (
        <p className="mt-4 text-sm font-medium text-score-bad">
          목록을 불러오지 못했습니다.
        </p>
      )}

      {/* 헤더 행 */}
      {contents && contents.length > 0 && (
        <div className="mb-2 grid grid-cols-[1fr_80px_repeat(7,52px)] items-center gap-3 px-4 text-[11px] font-bold text-ink-hint">
          <span>제목</span>
          <span className="text-center">Overall</span>
          <span className="text-center">SEO</span>
          <span className="text-center">AEO</span>
          <span className="text-center">GEO</span>
          <span className="text-center">Content</span>
          <span className="text-center">Citation</span>
          <span className="text-center">E-E-A-T</span>
          <span className="text-center">읽기</span>
        </div>
      )}

      <ul className="space-y-1">
        {contents?.map((c) => {
          const scores = calculateScores({
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

          const overall = Math.round(
            (scores.seo_score + scores.aeo_score + scores.geo_score +
              scores.content_score + scores.citation_score +
              scores.eeat_score + scores.readability_score) / 7
          )
          const { grade, color: gradeColor } = getGrade(overall)

          return (
            <li key={c.id} className="grid grid-cols-[1fr_80px_repeat(7,52px)] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-accent transition-all">
              {/* 제목 + 링크 */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/contents/${c.id}`}
                    className="truncate text-[15px] font-bold text-ink hover:text-accent"
                  >
                    {c.title}
                  </Link>
                  {c.gb5_bo_table && c.gb5_wr_id && (
                    <a
                      href={`https://hby1126hh.mycafe24.com/g5/bbs/board.php?bo_table=${c.gb5_bo_table}&wr_id=${c.gb5_wr_id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-hint hover:border-accent hover:text-accent"
                    >
                      GB5 ↗
                    </a>
                  )}
                  {c.page_slug && (
                    <a
                      href={`https://hby1126hh.mycafe24.com/g5${process.env.NEXT_PUBLIC_GB5_SUBPAGE_PATH ?? '/sub'}/${c.page_slug}.php`}
                      target="_blank" rel="noopener noreferrer"
                      className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-hint hover:border-accent hover:text-accent"
                    >
                      {c.page_slug} ↗
                    </a>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-hint">
                  {new Date(c.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>

              {/* Overall + Grade */}
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-black tabular-nums leading-none" style={{ color: gradeColor }}>
                  {overall}
                </span>
                <span className="mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-black text-white" style={{ backgroundColor: gradeColor }}>
                  {grade}
                </span>
              </div>

              {/* 개별 점수들 */}
              {[
                scores.seo_score,
                scores.aeo_score,
                scores.geo_score,
                scores.content_score,
                scores.citation_score,
                scores.eeat_score,
                scores.readability_score,
              ].map((score, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className={`text-[14px] font-bold tabular-nums ${tierText(score)}`}>{score}</span>
                </div>
              ))}
            </li>
          )
        })}
      </ul>

      {contents?.length === 0 && (
        <p className="mt-16 text-center text-sm text-ink-hint">
          아직 작성된 콘텐츠가 없습니다.
        </p>
      )}
    </div>
  )
}