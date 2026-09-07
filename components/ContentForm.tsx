'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ContentSourceMode = 'manual' | 'live'

type ContentFormValues = {
  title: string
  body: string
  content_source_mode?: ContentSourceMode | null
  manual_title?: string | null
  manual_body?: string | null
  gb5_bo_table?: string | null
  gb5_wr_id?: string | null
  page_slug?: string | null
  canonical_url?: string | null
  robots_index?: boolean | null
  robots_follow?: boolean | null
}

type ContentFormProps = {
  mode: 'new' | 'edit'
  contentId?: string
  initialValues?: Partial<ContentFormValues>
}

function normalizeSlug(value: string) {
  return value.trim().replace(/^\/+/, '').replace(/\.php$/i, '')
}

export default function ContentForm({ mode, contentId, initialValues }: ContentFormProps) {
  const router = useRouter()
  const initialSourceMode = initialValues?.content_source_mode === 'live' ? 'live' : 'manual'
  const [sourceMode, setSourceMode] = useState<ContentSourceMode>(initialSourceMode)
  const [manualTitle, setManualTitle] = useState(
    initialValues?.manual_title ?? (initialSourceMode === 'manual' ? initialValues?.title : '') ?? ''
  )
  const [manualBody, setManualBody] = useState(
    initialValues?.manual_body ?? (initialSourceMode === 'manual' ? initialValues?.body : '') ?? ''
  )
  const [liveTitle, setLiveTitle] = useState(initialSourceMode === 'live' ? initialValues?.title ?? '' : '')
  const [liveBody, setLiveBody] = useState(initialSourceMode === 'live' ? initialValues?.body ?? '' : '')
  const [gb5BoTable, setGb5BoTable] = useState(initialValues?.gb5_bo_table ?? '')
  const [gb5WrId, setGb5WrId] = useState(initialValues?.gb5_wr_id ?? '')
  const [pageSlug, setPageSlug] = useState(initialValues?.page_slug ?? '')
  const [canonicalUrl, setCanonicalUrl] = useState(initialValues?.canonical_url ?? '')
  const [robotsIndex, setRobotsIndex] = useState(initialValues?.robots_index !== false)
  const [robotsFollow, setRobotsFollow] = useState(initialValues?.robots_follow !== false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = mode === 'edit'
  const useLivePage = sourceMode === 'live'
  const title = useLivePage ? liveTitle : manualTitle
  const body = useLivePage ? liveBody : manualBody

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedManualTitle = manualTitle.trim()
    const trimmedManualBody = manualBody.trim()
    const trimmedLiveTitle = liveTitle.trim()
    const trimmedLiveBody = liveBody.trim()
    const trimmedBoTable = gb5BoTable.trim()
    const trimmedWrId = gb5WrId.trim()
    const trimmedPageSlug = normalizeSlug(pageSlug)
    const trimmedCanonical = canonicalUrl.trim()
    const hasGb5Post = !!trimmedBoTable && !!trimmedWrId
    const hasLiveSource = !!trimmedPageSlug || hasGb5Post

    if (!useLivePage && (!trimmedManualTitle || !trimmedManualBody)) {
      setError('직접 입력 모드에서는 제목과 본문을 입력해주세요.')
      return
    }

    if (useLivePage && !hasLiveSource) {
      setError('실제 페이지 모드에서는 GB5 게시글 정보 또는 고정 페이지 슬러그가 필요합니다.')
      return
    }

    if ((trimmedBoTable || trimmedWrId) && trimmedPageSlug) {
      setError('GB5 게시글 연동과 고정 페이지 슬러그는 동시에 설정할 수 없습니다.')
      return
    }

    if ((trimmedBoTable && !trimmedWrId) || (!trimmedBoTable && trimmedWrId)) {
      setError('GB5 게시판명과 게시글 번호는 함께 입력해주세요.')
      return
    }

    if (trimmedCanonical && !/^https?:\/\/.+/i.test(trimmedCanonical)) {
      setError('Canonical URL은 http:// 또는 https://로 시작하는 전체 URL이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(isEdit ? `/api/contents/${contentId}` : '/api/contents', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: useLivePage ? trimmedLiveTitle : trimmedManualTitle,
          body: useLivePage ? trimmedLiveBody : trimmedManualBody,
          content_source_mode: sourceMode,
          manual_title: trimmedManualTitle || null,
          manual_body: trimmedManualBody || null,
          gb5_bo_table: trimmedBoTable || null,
          gb5_wr_id: trimmedWrId || null,
          page_slug: trimmedPageSlug || null,
          canonical_url: trimmedCanonical || null,
          robots_index: robotsIndex,
          robots_follow: robotsFollow,
          import_from_live: useLivePage,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '저장에 실패했습니다.')
      }

      const saved = await res.json()
      router.push(`/contents/${isEdit ? contentId : saved.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-7 border-t border-line pt-5">
        <p className="mb-3 text-[17px] font-bold text-ink">작성 방식</p>
        <div className="grid grid-cols-2 gap-3">
          <label className={`rounded border px-4 py-3 ${
            sourceMode === 'manual' ? 'border-accent bg-surface-muted' : 'border-line'
          }`}>
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="radio"
                name="contentSourceMode"
                value="manual"
                checked={sourceMode === 'manual'}
                onChange={() => setSourceMode('manual')}
                className="h-4 w-4 accent-accent"
              />
              제목/본문 직접 입력
            </span>
            <span className="mt-1 block pl-6 text-[12px] text-ink-hint">
              직접 입력한 제목과 본문을 기준으로 SEO 메타태그와 JSON-LD를 생성합니다.
            </span>
          </label>

          <label className={`rounded border px-4 py-3 ${
            sourceMode === 'live' ? 'border-accent bg-surface-muted' : 'border-line'
          }`}>
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="radio"
                name="contentSourceMode"
                value="live"
                checked={sourceMode === 'live'}
                onChange={() => setSourceMode('live')}
                className="h-4 w-4 accent-accent"
              />
              실제 페이지에서 가져오기
            </span>
            <span className="mt-1 block pl-6 text-[12px] text-ink-hint">
              연결된 GB5 게시글 또는 고정 페이지를 읽어 제목/본문을 자동으로 채웁니다.
            </span>
          </label>
        </div>
      </div>

      <p className="mb-4 text-[17px] font-bold text-ink">콘텐츠 정보</p>

      <div className="grid grid-cols-[120px_1fr] items-center gap-y-5 border-t border-line pt-5">
        <label htmlFor="title" className="text-sm font-medium text-ink">
          제목 {!useLivePage && <span className="text-accent">*</span>}
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => (useLivePage ? setLiveTitle(e.target.value) : setManualTitle(e.target.value))}
          placeholder={useLivePage ? '저장하면 실제 페이지 제목으로 갱신됩니다' : '제목을 입력하세요'}
          className="h-10 rounded border border-line px-3 text-[15px] text-ink outline-none focus:border-accent"
        />

        <label htmlFor="body" className="self-start pt-2 text-sm font-medium text-ink">
          본문 {!useLivePage && <span className="text-accent">*</span>}
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => (useLivePage ? setLiveBody(e.target.value) : setManualBody(e.target.value))}
          rows={12}
          placeholder={useLivePage ? '저장하면 실제 페이지 본문으로 갱신됩니다' : '본문을 입력하세요'}
          className="min-h-[240px] resize-y rounded border border-line p-3 text-[15px] leading-relaxed text-ink outline-none focus:border-accent"
        />

        <label htmlFor="canonicalUrl" className="text-sm font-medium text-ink">
          Canonical URL
        </label>
        <input
          id="canonicalUrl"
          type="text"
          value={canonicalUrl}
          onChange={(e) => setCanonicalUrl(e.target.value)}
          placeholder="비워두면 page_slug 또는 GB5 정보로 자동 계산됩니다"
          className="h-10 rounded border border-line px-3 text-[15px] text-ink outline-none focus:border-accent"
        />

        <span className="text-sm font-medium text-ink">robots</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={robotsIndex}
              onChange={(e) => setRobotsIndex(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            검색엔진 색인 허용 (index)
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={robotsFollow}
              onChange={(e) => setRobotsFollow(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            링크 추적 허용 (follow)
          </label>
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-1 text-[15px] font-bold text-ink">연동 옵션</p>
        <p className="mb-4 text-[12px] text-ink-hint">
          실제 페이지 모드에서는 아래 GB5 게시글 정보 또는 고정 페이지 슬러그 중 하나가 필요합니다.
        </p>

        <p className="mb-2 text-[13px] font-medium text-ink-secondary">GB5 게시글 연동</p>
        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="gb5BoTable" className="mb-1.5 block text-[12px] text-ink-hint">
              게시판명 (bo_table)
            </label>
            <input
              id="gb5BoTable"
              type="text"
              value={gb5BoTable}
              onChange={(e) => setGb5BoTable(e.target.value)}
              placeholder="예: notice"
              className="h-10 w-full rounded border border-line px-3 text-[14px] text-ink outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="gb5WrId" className="mb-1.5 block text-[12px] text-ink-hint">
              게시글 번호 (wr_id)
            </label>
            <input
              id="gb5WrId"
              type="text"
              value={gb5WrId}
              onChange={(e) => setGb5WrId(e.target.value)}
              placeholder="예: 5"
              className="h-10 w-full rounded border border-line px-3 text-[14px] text-ink outline-none focus:border-accent"
            />
          </div>
        </div>

        <p className="mb-2 text-[13px] font-medium text-ink-secondary">고정 페이지 슬러그</p>
        <input
          type="text"
          value={pageSlug}
          onChange={(e) => setPageSlug(e.target.value)}
          placeholder="예: about (= /sub/about.php)"
          className="h-10 w-full max-w-xs rounded border border-line px-3 text-[14px] text-ink outline-none focus:border-accent"
        />
        <p className="mt-1.5 text-[12px] text-ink-hint">
          파일명만 입력하세요. 예: <code className="rounded bg-surface-muted px-1">/sub/about.php</code>는{' '}
          <code className="rounded bg-surface-muted px-1">about</code>
        </p>
      </div>

      {error && <p className="mt-5 text-sm font-medium text-score-bad">{error}</p>}

      <div className="mt-8 flex justify-end gap-2.5 border-t border-line pt-5">
        {isEdit && (
          <button
            type="button"
            onClick={() => router.push(`/contents/${contentId}`)}
            className="h-11 rounded border border-line px-6 text-sm font-medium text-ink-secondary hover:bg-surface-muted"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded bg-accent px-6 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? '저장 중...' : isEdit ? '수정 완료' : '저장하기'}
        </button>
      </div>
    </form>
  )
}
