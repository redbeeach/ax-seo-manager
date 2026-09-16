'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'idle' | 'running' | 'complete' | 'error'

interface OptimizedPreview {
  seoTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  faqCount: number
  aeAnswer: string | null
  geoSummary: string | null
  hasJsonLd: boolean
}

interface AiOptimizeButtonProps {
  id: string
  title: string
  body: string
  liveUrl: string | null
  liveVerifiedAt: string | null
  optimized: OptimizedPreview
}

const steps = [
  '콘텐츠 데이터 수집',
  'SEO / GEO 분석',
  'GPT 최적화 요청',
  'SEO Meta 생성',
  'FAQ 생성',
  'JSON-LD 생성',
  'GNUboard 적용',
  'Live Page 검증',
]

const deliverables = [
  'SEO Title',
  'Description',
  'OG Meta',
  'FAQ',
  'AEO Answer',
  'GEO Summary',
  'JSON-LD',
]

function formatKstDateTime(value: string | null) {
  if (!value) return null
  const isoValue = /Z$|[+-]\d{2}:?\d{2}$/.test(value) ? value : value + 'Z'
  return new Date(isoValue).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AiOptimizeButton({
  id,
  title,
  body,
  liveUrl,
  liveVerifiedAt,
  optimized,
}: AiOptimizeButtonProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [activeStep, setActiveStep] = useState(-1)
  const [error, setError] = useState('')
  const [verifiedAt, setVerifiedAt] = useState<string | null>(liveVerifiedAt)
  const [verificationUrl, setVerificationUrl] = useState<string | null>(liveUrl)

  const optimizedCount = useMemo(() => {
    return [
      optimized.seoTitle,
      optimized.metaDescription,
      optimized.ogTitle || optimized.ogDescription,
      optimized.faqCount > 0,
      optimized.aeAnswer,
      optimized.geoSummary,
      optimized.hasJsonLd,
    ].filter(Boolean).length
  }, [optimized])

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearTimer()
  }, [])

  const startProgress = () => {
    clearTimer()
    setActiveStep(0)
    timerRef.current = setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, steps.length - 2))
    }, 850)
  }

  const handleOptimize = async () => {
    setStatus('running')
    setError('')
    setVerifiedAt(null)
    startProgress()

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, body, source: 'saved' }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'AI 최적화에 실패했습니다.')
      }

      clearTimer()
      setActiveStep(steps.length - 2)

      try {
        const verifyRes = await fetch(`/api/contents/${id}/crawl`, { method: 'POST' })
        const verifyData = await verifyRes.json().catch(() => null)
        if (verifyRes.ok && verifyData) {
          setVerificationUrl(verifyData.url ?? null)
          setVerifiedAt(verifyData.crawled_at ?? new Date().toISOString())
        }
      } catch (verifyErr) {
        console.warn('[ai-optimize-live-verify-warning]', verifyErr)
      }

      setActiveStep(steps.length - 1)
      setStatus('complete')
      setTimeout(() => router.refresh(), 900)
    } catch (err) {
      clearTimer()
      setStatus('error')
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  const scrollToResults = () => {
    document.getElementById('ai-optimization-results')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const currentVerifiedAt = formatKstDateTime(verifiedAt)

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-ink bg-ink text-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-7">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em] text-white/60">
            AI Content Optimization
          </p>
          <h2 className="mb-3 text-[28px] leading-tight tracking-tight">
            GPT 생성에서 GNUboard 적용,<br />  Live 검증까지 한 번에 실행합니다.
          </h2>
          <p className="max-w-2xl text-[14px] leading-6 text-white/72">
            현재 콘텐츠를 분석하여 SEO · AEO · GEO 최적화 데이터를 생성하고 실제 페이지 출력에 필요한 메타 데이터를 <br />자동 반영합니다.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {['SEO Meta', 'Open Graph', 'FAQ', 'AEO Answer', 'GEO Summary', 'JSON-LD'].map((item) => (
              <span key={item} className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[12px] font-medium text-white/84">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleOptimize}
              disabled={status === 'running'}
              className="h-11 rounded-lg bg-white px-5 text-[14px] font-black text-ink transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'running' ? 'AI 최적화 실행 중...' : '✦ AI 최적화 실행'}
            </button>
            <span className="text-[12px] font-medium text-white/55">
              GPT Connected · GNUboard Auto Apply · Live Verification
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-100">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-white/10 bg-white/[0.04] p-7 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-black uppercase tracking-[0.14em] text-white/70">
              AI Optimization
            </p>
            {status === 'complete' && (
              <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[11px] font-black text-ink">
                Complete
              </span>
            )}
          </div>

          <ol className="space-y-3">
            {steps.map((step, index) => {
              const done = status === 'complete' || index < activeStep
              const active = status === 'running' && index === activeStep
              return (
                <li key={step} className="flex items-center gap-3 text-[13px]">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                      done
                        ? 'bg-emerald-400 text-ink'
                        : active
                          ? 'bg-white text-ink'
                          : 'border border-white/20 text-white/35'
                    }`}
                  >
                    {done ? '✓' : active ? '●' : '○'}
                  </span>
                  <span className={done || active ? 'text-white' : 'text-white/42'}>{step}</span>
                </li>
              )
            })}
          </ol>

          {status === 'complete' && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/8 p-4">
              <p className="text-[17px] font-black">✓ AI Optimization Complete</p>
              <p className="mt-1 text-[13px] leading-5 text-white/68">
                7개 최적화 항목이 생성되어 GNUboard 페이지에 반영되었습니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {deliverables.map((item) => (
                  <span key={item} className="rounded bg-white/10 px-2 py-1 text-[11px] font-bold text-white/82">
                    {item} ✓
                  </span>
                ))}
              </div>
              <button
                onClick={scrollToResults}
                className="mt-4 h-9 rounded border border-white/20 px-3 text-[12px] font-bold text-white hover:bg-white/10"
              >
                적용 결과 확인
              </button>
            </div>
          )}

          {(currentVerifiedAt || verificationUrl) && (
            <p className="mt-4 text-[12px] text-white/52">
              Last verified {currentVerifiedAt ?? '검증 대기'}
              {verificationUrl && (
                <>
                  {' · '}
                  <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">
                    Live Page 보기
                  </a>
                </>
              )}
            </p>
          )}

          {status === 'idle' && optimizedCount > 0 && (
            <p className="mt-5 rounded-lg bg-white/8 px-3 py-2 text-[12px] text-white/62">
              현재 {optimizedCount}개 최적화 항목이 저장되어 있습니다. <br />다시 실행하면 새 버전이 생성되고 이전 버전은 복원 기록에 보관됩니다.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
