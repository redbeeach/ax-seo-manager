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
      <div className="mb-3 inline-flex rounded border border-line p-1">
        <button
          type="button"
          onClick={() => setSource('saved')}
          className={`h-8 rounded px-3 text-[12px] font-medium ${
            source === 'saved'
              ? 'bg-accent text-white'
              : 'text-ink-secondary hover:bg-surface-muted'
          }`}
        >
          저장된 내용 기준
        </button>
        <button
          type="button"
          onClick={() => setSource('live')}
          className={`h-8 rounded px-3 text-[12px] font-medium ${
            source === 'live'
              ? 'bg-accent text-white'
              : 'text-ink-secondary hover:bg-surface-muted'
          }`}
        >
          실제 페이지 기준
        </button>
      </div>

      <button
        onClick={handleOptimize}
        disabled={loading}
        className="flex h-10 items-center gap-1.5 rounded bg-accent px-4 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        <span aria-hidden>AI</span>
        {loading ? 'AI 분석 중...' : 'AI 최적화 실행'}
      </button>

      {error && (
        <p className="mt-2 text-sm font-medium text-score-bad">{error}</p>
      )}
    </div>
  )
}
