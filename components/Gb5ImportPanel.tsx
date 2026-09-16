'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ImportResult = {
  type: 'post' | 'page'
  key: string
  title: string
  action: 'created' | 'updated' | 'skipped' | 'error'
  id?: string
  error?: string
}

type ImportResponse = {
  ok?: boolean
  dry_run?: boolean
  fetched?: { posts: number; pages: number }
  summary?: { created: number; updated: number; skipped: number; error: number }
  results?: ImportResult[]
  error?: string
  detail?: string
}

function actionLabel(action: ImportResult['action']) {
  if (action === 'created') return '신규'
  if (action === 'updated') return '갱신'
  if (action === 'skipped') return '건너뜀'
  return '오류'
}

export default function Gb5ImportPanel() {
  const router = useRouter()
  const [boTables, setBoTables] = useState('')
  const [pageSlugs, setPageSlugs] = useState('')
  const [limit, setLimit] = useState('50')
  const [dryRun, setDryRun] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ImportResponse | null>(null)
  const [error, setError] = useState('')

  const handleImport = async () => {
    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const res = await fetch('/api/gb5/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bo_tables: boTables,
          page_slugs: pageSlugs,
          limit: Number(limit),
          dry_run: dryRun,
        }),
      })
      const data = (await res.json()) as ImportResponse

      if (!res.ok) {
        throw new Error(data.error || '그누보드 가져오기에 실패했습니다.')
      }

      setResponse(data)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="mb-2 text-sm font-bold text-accent">GNUboard Pull Sync</p>
        <h2 className="text-[24px] font-black tracking-tight text-ink">그누보드 글 가져오기</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
          게시판명과 서브페이지 slug를 입력한 뒤 버튼을 누르면 그누보드 export API에서 원문을 가져와
          AX SEO Manager 콘텐츠로 자동 등록합니다.
        </p>
      </div>

      <div className="grid gap-5 border-t border-line pt-5">
        <div>
          <label htmlFor="boTables" className="mb-1.5 block text-sm font-medium text-ink">
            게시판명
          </label>
          <input
            id="boTables"
            type="text"
            value={boTables}
            onChange={(event) => setBoTables(event.target.value)}
            placeholder="notice, free, gallery"
            className="h-10 w-full rounded border border-line px-3 text-sm text-ink outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-ink-hint">쉼표로 여러 게시판을 입력할 수 있습니다. 비워두면 환경변수 기본값을 사용합니다.</p>
        </div>

        <div>
          <label htmlFor="pageSlugs" className="mb-1.5 block text-sm font-medium text-ink">
            지정 서브페이지 slug
          </label>
          <input
            id="pageSlugs"
            type="text"
            value={pageSlugs}
            onChange={(event) => setPageSlugs(event.target.value)}
            placeholder="about, service, contact"
            className="h-10 w-full rounded border border-line px-3 text-sm text-ink outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-ink-hint">예: `/sub/about.php`는 `about`만 입력합니다.</p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="limit" className="mb-1.5 block text-sm font-medium text-ink">
              게시판별 최대 글 수
            </label>
            <input
              id="limit"
              type="number"
              min="1"
              max="200"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              className="h-10 w-28 rounded border border-line px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <label className="flex h-10 items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            저장하지 않고 테스트
          </label>

          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="h-10 rounded bg-accent px-5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? '가져오는 중...' : '가져오기'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-score-bad">
          {error}
        </p>
      )}

      {response?.summary && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryItem label="신규" value={response.summary.created} />
            <SummaryItem label="갱신" value={response.summary.updated} />
            <SummaryItem label="건너뜀" value={response.summary.skipped} />
            <SummaryItem label="오류" value={response.summary.error} />
          </div>

          <ul className="max-h-[360px] space-y-2 overflow-auto">
            {(response.results ?? []).map((item, index) => (
              <li key={`${item.type}-${item.key}-${index}`} className="rounded border border-line px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-bold text-ink-secondary">
                    {item.type === 'post' ? '게시글' : '페이지'}
                  </span>
                  <span className="rounded border border-line px-2 py-0.5 text-xs font-bold text-ink-secondary">
                    {actionLabel(item.action)}
                  </span>
                  <span className="font-bold text-ink">{item.title || item.key}</span>
                  <span className="text-xs text-ink-hint">{item.key}</span>
                </div>
                {item.error && <p className="mt-1 text-xs text-score-bad">{item.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-line bg-surface px-4 py-3">
      <p className="text-xs font-medium text-ink-hint">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  )
}
