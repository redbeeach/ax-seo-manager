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

function formatKstDateTime(value: string) {
  const isoValue = /Z$|[+-]\d{2}:?\d{2}$/.test(value) ? value : value + 'Z'
  return new Date(isoValue).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

function scoreColorClass(score: number) {
  if (score >= 80) return 'text-score-good'
  if (score >= 50) return 'text-score-mid'
  return 'text-score-bad'
}

function versionLabel(version: Version, index: number) {
  if (version.label) return version.label
  if (index === 0) return 'Current Snapshot'
  return 'Saved Version'
}

export default function VersionHistory({ contentId }: { contentId: string }) {
  const router = useRouter()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [open, setOpen] = useState(true)

  const loadVersions = async () => {
    const res = await fetch(`/api/contents/${contentId}/versions`)
    if (res.ok) {
      setVersions(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!open) return
    let canceled = false

    fetch(`/api/contents/${contentId}/versions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!canceled) setVersions(data)
      })
      .finally(() => {
        if (!canceled) setLoading(false)
      })

    return () => {
      canceled = true
    }
  }, [contentId, open])

  const handleRestore = async (versionId: string) => {
    const confirmed = window.confirm(
      '선택한 버전으로 복원할까요? 현재 적용된 최적화 데이터는 이전 버전 값으로 교체됩니다.'
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
    const newLabel = window.prompt('이 버전에 남길 메모를 입력하세요.', currentLabel ?? '')
    if (newLabel === null) return

    const res = await fetch(`/api/contents/${contentId}/versions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId, label: newLabel }),
    })
    if (res.ok) {
      setLoading(true)
      await loadVersions()
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          if (!open) setLoading(true)
          setOpen((v) => !v)
        }}
        className="flex items-center gap-1.5 text-[15px] font-bold text-ink"
      >
        버전 기록 {open ? '접기' : '펼치기'}
      </button>

      {open && (
        <div className="mt-4">
          {loading && <p className="text-sm text-ink-hint">불러오는 중...</p>}

          {!loading && versions.length === 0 && (
            <p className="text-sm text-ink-hint">
              아직 저장된 버전이 없습니다. AI 최적화를 실행하면 적용 전/후 스냅샷이 자동 저장됩니다.
            </p>
          )}

          <ul className="space-y-2">
            {versions.map((v, index) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-ink">
                      v{versions.length - index}
                    </span>
                    {index === 0 && (
                      <span className="rounded bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
                        CURRENT
                      </span>
                    )}
                    <span className="rounded bg-surface-muted px-2 py-0.5 text-[11px] text-ink-secondary">
                      {versionLabel(v, index)}
                    </span>
                    <span className="text-[12px] text-ink-hint">
                      {formatKstDateTime(v.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 flex gap-2 text-[12px] text-ink-hint">
                    <span>
                      SEO <span className={scoreColorClass(v.seo_score ?? 0)}>{v.seo_score ?? 0}</span>
                    </span>
                    <span>
                      AEO <span className={scoreColorClass(v.aeo_score ?? 0)}>{v.aeo_score ?? 0}</span>
                    </span>
                    <span>
                      GEO <span className={scoreColorClass(v.geo_score ?? 0)}>{v.geo_score ?? 0}</span>
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handleLabel(v.id, v.label)}
                    className="rounded border border-line px-2.5 py-1 text-[12px] text-ink-secondary hover:bg-surface-muted"
                  >
                    메모
                  </button>
                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoringId === v.id}
                    className="rounded border border-ink px-2.5 py-1 text-[12px] font-bold text-ink hover:bg-surface-muted disabled:opacity-50"
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
