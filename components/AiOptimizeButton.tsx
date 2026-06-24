'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FaqItem {
  question: string
  answer: string
}

interface OptimizeResult {
  seo_title: string
  meta_description: string
  og_title: string
  og_description: string
  faq: FaqItem[]
  ae_answer: string
  geo_summary: string
  json_ld: Record<string, unknown>
}

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
        body: JSON.stringify({ id, title, body }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'AI 최적화에 실패했습니다.')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleOptimize}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
      >
        {loading ? 'AI 분석 중... (몇 초 걸려요)' : '✨ AI 최적화 실행'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}