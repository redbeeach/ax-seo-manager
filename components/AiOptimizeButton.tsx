'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOptimize = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, body, source: 'saved' }),
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
      <button
        onClick={handleOptimize}
        disabled={loading}
        className="flex h-10 items-center rounded bg-accent px-4 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? 'AI 최적화 중... 보통 10~30초 걸려요' : 'AI 최적화 실행'}
      </button>

      {error && (
        <p className="mt-2 text-sm font-medium text-score-bad">{error}</p>
      )}
    </div>
  )
}
