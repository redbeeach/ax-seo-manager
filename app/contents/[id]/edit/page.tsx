'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
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
    return <div className="max-w-2xl mx-auto p-8">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">콘텐츠 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">본문</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? '저장 중...' : '수정 완료'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/contents/${id}`)}
            className="border px-4 py-2 rounded-md"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}