'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OptimizeSource = 'saved' | 'live'

export default function AiOptimizeButton({
  id,
  title,
  body,
}: {
  id: string
  title: string
  body: string
}) {
  const router = useRouter()
  const [source, setSource] = useState<OptimizeSource>('saved')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOptimize = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, body, source }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'AI 최적화에 실패했습니다.')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <fieldset className="mb-3">
        <legend className="mb-2 text-[12px] font-medium text-ink-hint">최적화 기준</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="radio"
              name="optimizeSource"
              value="saved"
              checked={source === 'saved'}
              onChange={() => setSource('saved')}
              className="h-4 w-4 accent-accent"
            />
            저장된 내용
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="radio"
              name="optimizeSource"
              value="live"
              checked={source === 'live'}
              onChange={() => setSource('live')}
              className="h-4 w-4 accent-accent"
            />
            실제 페이지
          </label>
        </div>
      </fieldset>

      <button
        onClick={handleOptimize}
        disabled={loading}
        className="flex h-10 items-center rounded bg-accent px-4 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? '분석 중...' : 'AI 최적화 실행'}
      </button>

      {error && (
        <p className="mt-2 text-sm font-medium text-score-bad">{error}</p>
      )}
    </div>
  )
}
