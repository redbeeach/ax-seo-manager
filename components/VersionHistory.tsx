'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Version {
  id: string
  seo_title: string | null
  seo_score: number | null
  aeo_score: number | null
  geo_score: number | null
  label: string | null
  created_at: string
}

function scoreColorClass(score: number) {
  if (score >= 80) return 'text-score-good'
  if (score >= 50) return 'text-score-mid'
  return 'text-score-bad'
}

export default function VersionHistory({ contentId }: { contentId: string }) {
  const router = useRouter()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/contents/${contentId}/versions`)
    if (res.ok) {
      setVersions(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  const handleRestore = async (versionId: string) => {
    const confirmed = window.confirm(
      '이 버전으로 복원하면 현재 적용된 메타데이터가 덮어씌워집니다. 계속할까요?'
    )
    if (!confirmed) return

    setRestoringId(versionId)
    const res = await fetch(
      `/api/contents/${contentId}/versions/${versionId}/restore`,
      { method: 'POST' }
    )
    setRestoringId(null)

    if (res.ok) {
      router.refresh()
    } else {
      alert('복원에 실패했습니다.')
    }
  }

  const handleLabel = async (versionId: string, currentLabel: string | null) => {
    const newLabel = window.prompt('이 버전에 메모를 남기세요 (예: 이게 제일 좋음)', currentLabel ?? '')
    if (newLabel === null) return

    const res = await fetch(`/api/contents/${contentId}/versions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId, label: newLabel }),
    })
    if (res.ok) load()
  }

  return (
    <div className="border-t border-line pt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[15px] font-bold text-ink"
      >
        버전 기록 {open ? '▾' : '▸'}
      </button>

      {open && (
        <div className="mt-4">
          {loading && <p className="text-sm text-ink-hint">불러오는 중...</p>}

          {!loading && versions.length === 0 && (
            <p className="text-sm text-ink-hint">아직 저장된 버전이 없습니다.</p>
          )}

          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded border border-line px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">
                      {new Date(v.created_at).toLocaleString('ko-KR')}
                    </span>
                    {v.label && (
                      <span className="rounded bg-surface-muted px-2 py-0.5 text-[11px] text-ink-secondary">
                        {v.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex gap-2 text-[12px] text-ink-hint">
                    <span>
                      SEO <span className={scoreColorClass(v.seo_score ?? 0)}>{v.seo_score}</span>
                    </span>
                    <span>
                      AEO <span className={scoreColorClass(v.aeo_score ?? 0)}>{v.aeo_score}</span>
                    </span>
                    <span>
                      GEO <span className={scoreColorClass(v.geo_score ?? 0)}>{v.geo_score}</span>
                    </span>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleLabel(v.id, v.label)}
                    className="rounded border border-line px-2.5 py-1 text-[12px] text-ink-secondary hover:bg-surface-muted"
                  >
                    메모
                  </button>
                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoringId === v.id}
                    className="rounded border border-accent px-2.5 py-1 text-[12px] font-medium text-accent hover:bg-surface-muted disabled:opacity-50"
                  >
                    {restoringId === v.id ? '복원 중...' : '이 버전으로 복원'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}