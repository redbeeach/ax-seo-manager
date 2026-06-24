'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm('정말 삭제하시겠습니까?')
    if (!confirmed) return

    setLoading(true)
    const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' })

    if (res.ok) {
      router.push('/contents')
      router.refresh()
    } else {
      alert('삭제에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="border border-red-500 text-red-500 px-4 py-2 rounded-md disabled:opacity-50"
    >
      {loading ? '삭제 중...' : '삭제'}
    </button>
  )
}