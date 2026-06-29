'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewContentPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gb5BoTable, setGb5BoTable] = useState('')
  const [gb5WrId, setGb5WrId] = useState('')
  const [pageSlug, setPageSlug] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력해주세요.')
      return
    }

    if ((gb5BoTable || gb5WrId) && pageSlug) {
      setError('GB5 게시글 연동과 고정 페이지 슬러그는 동시에 설정할 수 없습니다.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          gb5_bo_table: gb5BoTable || null,
          gb5_wr_id: gb5WrId || null,
          page_slug: pageSlug || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '저장에 실패했습니다.')
      }

      const created = await res.json()
      router.push(`/contents/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl bg-surface px-8 py-10">
      <p className="mb-2.5 text-sm font-medium text-accent">콘텐츠 / 새 글</p>
      <h1 className="mb-7 text-[32px] font-bold tracking-tight text-ink">
        새 콘텐츠 작성
      </h1>

      <div className="mb-7 border-t border-line" />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-[120px_1fr] items-center gap-y-5">
          <label htmlFor="title" className="text-sm font-medium text-ink">
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="h-10 rounded border border-line px-3 text-[15px] text-ink outline-none focus:border-accent"
          />

          <label
            htmlFor="body"
            className="self-start pt-2 text-sm font-medium text-ink"
          >
            본문
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            placeholder="본문을 입력하세요"
            className="min-h-[200px] resize-y rounded border border-line p-3 text-[15px] leading-relaxed text-ink outline-none focus:border-accent"
          />
        </div>

        {/* 연동 옵션 - 둘 중 하나만 선택, 둘 다 비워두면 AX 단독 콘텐츠 */}
        <div className="mt-8 border-t border-line pt-6">
          <p className="mb-1 text-[15px] font-bold text-ink">연동 옵션 (선택)</p>
          <p className="mb-4 text-[12px] text-ink-hint">
            그누보드 게시글과 연동하거나, 고정 페이지(회사소개 등) 슬러그를 지정할 수 있습니다. 둘 중 하나만 선택하세요.
          </p>

          <p className="mb-2 text-[13px] font-medium text-ink-secondary">그누보드 게시글 연동</p>
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] text-ink-hint">
                게시판명 (bo_table)
              </label>
              <input
                type="text"
                value={gb5BoTable}
                onChange={(e) => setGb5BoTable(e.target.value)}
                placeholder="예: myproject"
                className="h-10 w-full rounded border border-line px-3 text-[14px] text-ink outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] text-ink-hint">
                게시글번호 (wr_id)
              </label>
              <input
                type="text"
                value={gb5WrId}
                onChange={(e) => setGb5WrId(e.target.value)}
                placeholder="예: 5"
                className="h-10 w-full rounded border border-line px-3 text-[14px] text-ink outline-none focus:border-accent"
              />
            </div>
          </div>

          <p className="mb-2 text-[13px] font-medium text-ink-secondary">
            고정 페이지 슬러그
          </p>
          <input
            type="text"
            value={pageSlug}
            onChange={(e) => setPageSlug(e.target.value)}
            placeholder="예: about (= /sub/about.php)"
            className="h-10 w-full max-w-xs rounded border border-line px-3 text-[14px] text-ink outline-none focus:border-accent"
          />
          <p className="mt-1.5 text-[12px] text-ink-hint">
            그누보드 파일명(확장자 제외)과 똑같이 입력하세요. 예: <code className="rounded bg-surface-muted px-1">/sub/about.php</code> → <code className="rounded bg-surface-muted px-1">about</code>
          </p>
        </div>

        {error && (
          <p className="mt-5 text-sm font-medium text-score-bad">{error}</p>
        )}

        <div className="mt-8 flex justify-end gap-2.5 border-t border-line pt-5">
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded bg-accent px-6 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  )
}