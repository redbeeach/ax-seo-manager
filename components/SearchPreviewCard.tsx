interface SearchPreviewCardProps {
  seoTitle: string | null
  metaDescription: string | null
  geoSummary: string | null
  aeAnswer: string | null
  pageTitle: string
  liveUrl: string | null
}

function formatGoogleUrl(url: string | null, fallbackTitle: string): { breadcrumb: string; display: string } {
  if (!url) {
    return { breadcrumb: 'example.com', display: 'example.com' }
  }
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    const parts = parsed.pathname.split('/').filter(Boolean)
    const breadcrumb = parts.length > 0
      ? `${host} › ${parts.join(' › ')}`
      : host
    return { breadcrumb, display: host }
  } catch {
    return { breadcrumb: url, display: url }
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default function SearchPreviewCard({
  seoTitle,
  metaDescription,
  geoSummary,
  aeAnswer,
  pageTitle,
  liveUrl,
}: SearchPreviewCardProps) {
  const displayTitle = seoTitle || pageTitle
  const displayDesc = metaDescription || geoSummary || '설명이 없습니다.'
  const { breadcrumb } = formatGoogleUrl(liveUrl, pageTitle)

  // ChatGPT 답변: ae_answer 우선, 없으면 geo_summary 앞부분
  const chatGptAnswer =
    aeAnswer ||
    (geoSummary ? geoSummary.slice(0, 200) : null)

  if (!seoTitle) {
    return (
      <div className="mb-8 rounded-xl border border-line bg-surface p-5">
        <p className="mb-2 text-[14px] font-bold text-ink">🔍 검색 미리보기</p>
        <p className="text-[13px] text-ink-hint">
          AI 최적화를 먼저 실행하면 SEO Title / Meta Description 기반 실제 검색 미리보기를 보여줍니다.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Google Preview */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-ink-hint">
          🔍 Google 검색 미리보기
        </p>
        <div className="rounded-lg border border-line bg-white p-4">
          {/* 사이트 정보 */}
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[10px]">
              G
            </div>
            <div>
              <p className="text-[13px] leading-none text-ink">{formatGoogleUrl(liveUrl, pageTitle).display}</p>
              <p className="text-[11px] text-[#4D5156]">{breadcrumb}</p>
            </div>
          </div>
          {/* 제목 */}
          <p
            className="mb-1 text-[19px] leading-snug"
            style={{ color: '#1a0dab' }}
          >
            {truncate(displayTitle, 60)}
          </p>
          {/* 설명 */}
          <p className="text-[13px] leading-relaxed" style={{ color: '#4D5156' }}>
            {truncate(displayDesc, 155)}
          </p>
          {/* 글자수 힌트 */}
          <div className="mt-2 flex gap-4 text-[11px] text-ink-hint">
            <span className={displayTitle.length > 60 ? 'text-score-bad' : 'text-ink-hint'}>
              제목 {displayTitle.length}자 {displayTitle.length > 60 ? '(초과 — 잘릴 수 있음)' : '/ 60자 이내'}
            </span>
            <span className={displayDesc.length > 155 ? 'text-score-bad' : 'text-ink-hint'}>
              설명 {displayDesc.length}자 {displayDesc.length > 155 ? '(초과 — 잘릴 수 있음)' : '/ 155자 이내'}
            </span>
          </div>
        </div>
      </div>

      {/* ChatGPT Preview */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-ink-hint">
          💬 ChatGPT가 인용한다면
        </p>
        <div className="rounded-lg bg-[#212121] p-4">
          {/* ChatGPT 스타일 헤더 */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#212121]">
              C
            </div>
            <span className="text-[12px] font-medium text-white/70">ChatGPT</span>
          </div>
          {chatGptAnswer ? (
            <p className="text-[13px] leading-relaxed text-white/90">
              &ldquo;{chatGptAnswer}&rdquo;
            </p>
          ) : (
            <p className="text-[13px] text-white/40">
              AEO 한 줄 답변 또는 GEO 요약이 있으면 여기에 미리보기가 표시됩니다.
            </p>
          )}
          {/* 출처 표시 스타일 */}
          {chatGptAnswer && liveUrl && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-white/20" />
              <span className="text-[11px] text-white/40">{formatGoogleUrl(liveUrl, pageTitle).display}</span>
            </div>
          )}
        </div>
        {!chatGptAnswer && (
          <p className="mt-2 text-[12px] text-ink-hint">
            💡 AI 최적화 → AEO 한 줄 답변 또는 GEO 요약을 채우면 ChatGPT 인용 미리보기가 활성화됩니다.
          </p>
        )}
      </div>
    </div>
  )
}