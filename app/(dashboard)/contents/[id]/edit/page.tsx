'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ContentForm from '@/components/ContentForm'

type ContentData = {
  title: string
  body: string
  content_source_mode?: 'manual' | 'live' | null
  manual_title?: string | null
  manual_body?: string | null
  gb5_bo_table?: string | null
  gb5_wr_id?: string | null
  page_slug?: string | null
  canonical_url?: string | null
  robots_index?: boolean | null
  robots_follow?: boolean | null
  seo_score?: number | null
  aeo_score?: number | null
  geo_score?: number | null
}

export default function EditContentPage() {
  const params = useParams()
  const id = params.id as string
  const [content, setContent] = useState<ContentData | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/contents/${id}`)
      if (res.ok) {
        setContent(await res.json())
      }
      setFetching(false)
    }

    load()
  }, [id])

  if (fetching) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-sm text-ink-hint">
        불러오는 중...
      </div>
    )
  }

  if (!content) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-sm text-score-bad">
        콘텐츠를 불러오지 못했습니다.
      </div>
    )
  }

  const scores = [content.seo_score, content.aeo_score, content.geo_score].filter(
    (score): score is number => typeof score === 'number'
  )
  const score = scores.length > 0
    ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
    : null
  const scoreColor =
    score === null
      ? 'text-ink-secondary'
      : score >= 80
      ? 'text-score-good'
      : score >= 50
      ? 'text-score-mid'
      : 'text-score-bad'

  return (
    <div className="mx-auto max-w-3xl bg-surface px-8 py-10">
      <div className="mb-5 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="mb-2.5 text-sm font-medium text-accent">콘텐츠 / 수정</p>
          <h1 className="truncate text-[32px] font-bold tracking-tight text-ink">
            {content.title || '제목 없음'}
          </h1>
        </div>
        {score !== null && (
          <div className="shrink-0 text-right text-[13px] text-ink-hint">
            <span className="block text-sm font-medium text-ink-secondary">종합 점수</span>
            <span className={`text-lg font-bold ${scoreColor}`}>{score}점</span>
          </div>
        )}
      </div>

      <div className="mb-8 border-t border-line" />

      <ContentForm mode="edit" contentId={id} initialValues={content} />
    </div>
  )
}
