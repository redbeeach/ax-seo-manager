import { supabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

function scoreColorClass(score: number) {
  if (score >= 80) return 'text-score-good'
  if (score >= 50) return 'text-score-mid'
  return 'text-score-bad'
}

export default async function ContentsListPage() {
  const { data: contents, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl bg-surface px-8 py-10">
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

      <div className="mb-2 border-t border-line" />

      {error && (
        <p className="mt-4 text-sm font-medium text-score-bad">
          목록을 불러오지 못했습니다.
        </p>
      )}

      <ul>
        {contents?.map((c) => (
          <li key={c.id} className="border-b border-line py-5">
            <div className="flex items-center gap-2">
              <Link
                href={`/contents/${c.id}`}
                className="text-[17px] font-bold text-ink hover:text-accent"
              >
                {c.title}
              </Link>
              {c.gb5_bo_table && c.gb5_wr_id && (
                <a
                  href={`https://hby1126hh.mycafe24.com/g5/bbs/board.php?bo_table=${c.gb5_bo_table}&wr_id=${c.gb5_wr_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-hint hover:border-accent hover:text-accent"
                  title="그누보드 원본 글 새 탭에서 열기"
                >
                  GB5 ↗
                </a>
              )}
              {c.page_slug && (
                <a
                  href={`https://hby1126hh.mycafe24.com/g5/sub/${c.page_slug}.php`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-hint hover:border-accent hover:text-accent"
                  title="고정 페이지 새 탭에서 열기"
                >
                  /sub/{c.page_slug} ↗
                </a>
              )}
            </div>
            <p className="mt-2 flex gap-3 text-[13px] text-ink-hint">
              <span>
                SEO{' '}
                <span className={`font-medium ${scoreColorClass(c.seo_score)}`}>
                  {c.seo_score}
                </span>
              </span>
              <span aria-hidden>·</span>
              <span>
                AEO{' '}
                <span className={`font-medium ${scoreColorClass(c.aeo_score)}`}>
                  {c.aeo_score}
                </span>
              </span>
              <span aria-hidden>·</span>
              <span>
                GEO{' '}
                <span className={`font-medium ${scoreColorClass(c.geo_score)}`}>
                  {c.geo_score}
                </span>
              </span>
            </p>
          </li>
        ))}
      </ul>

      {contents?.length === 0 && (
        <p className="mt-16 text-center text-sm text-ink-hint">
          아직 작성된 콘텐츠가 없습니다.
        </p>
      )}
    </div>
  )
}