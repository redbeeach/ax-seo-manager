'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/contents/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTitle(data.title)
        setBody(data.body)
        // seo_score / aeo_score / geo_score 중 있는 거 평균 (없으면 null)
        const scores = [data.seo_score, data.aeo_score, data.geo_score].filter(
          (s) => typeof s === 'number'
        )
        if (scores.length > 0) {
          setScore(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
        }
      }
      setFetching(false)
    }
    load()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '수정에 실패했습니다.')
      }

      router.push(`/contents/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-sm text-ink-hint">
        불러오는 중...
      </div>
    )
  }

  const scoreColor =
    score === null
      ? 'text-ink-secondary'
      : score >= 80
      ? 'text-score-good'
      : score >= 50
      ? 'text-score-mid'
      : 'text-score-bad'

  return (
    <div className="mx-auto max-w-3xl w-[1400px] bg-surface px-8 py-10">
      {/* 헤더 */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-2.5 text-sm font-medium text-accent">콘텐츠 / 수정</p>
          <h1 className="text-[32px] font-bold tracking-tight text-ink">
            {title || '제목 없음'}
          </h1>
        </div>
        {score !== null && (
          <div className="flex items-center gap-1.5 text-[13px] text-ink-hint">
            <span className="text-sm font-medium text-ink-secondary">종합 점수</span>
            <span className={`text-lg font-bold ${scoreColor}`}>{score}점</span>
          </div>
        )}
      </div>

      <div className="mb-8 border-t border-line" />

      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-right text-xs text-ink-hint">
          * 은 필수 입력 항목입니다
        </p>

        <p className="mb-4 text-[17px] font-bold text-ink">콘텐츠 정보</p>

        <div className="grid grid-cols-[120px_1fr] items-center gap-y-5 border-t border-line pt-5">
          <label htmlFor="title" className="text-sm font-medium text-ink">
            제목 <span className="text-accent">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 rounded border border-line px-3 text-[15px] text-ink outline-none focus:border-accent"
          />

          <label
            htmlFor="body"
            className="self-start pt-2 text-sm font-medium text-ink"
          >
            본문 <span className="text-accent">*</span>
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="min-h-[200px] resize-y rounded border border-line p-3 text-[15px] leading-relaxed text-ink outline-none focus:border-accent"
          />
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-score-bad">{error}</p>
        )}

        {/* 액션 */}
        <div className="mt-8 flex justify-end gap-2.5 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => router.push(`/contents/${id}`)}
            className="h-11 rounded border border-line px-6 text-sm font-medium text-ink-secondary hover:bg-surface-muted"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded bg-accent px-6 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}