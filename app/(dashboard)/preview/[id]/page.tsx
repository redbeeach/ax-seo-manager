import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: content, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !content) {
    notFound()
  }

  const displayTitle = content.seo_title || content.title
  const displayDescription =
    content.meta_description || content.body.slice(0, 150)

  const titleOk = displayTitle.length <= 60
  const descOk = displayDescription.length <= 155

  return (
    <div className="mx-auto max-w-3xl bg-surface px-8 py-10">
      {/* 헤더 */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="mb-2.5 text-sm font-medium text-accent">콘텐츠 / 미리보기</p>
          <h1 className="text-[32px] font-bold tracking-tight text-ink">
            검색결과 미리보기
          </h1>
        </div>
        <Link
          href={`/contents/${id}`}
          className="flex items-center gap-1 text-sm font-medium text-ink hover:text-accent"
        >
          <span aria-hidden>←</span> 콘텐츠로 돌아가기
        </Link>
      </div>

      <div className="mb-9 border-t border-line" />

      {/* Google 검색결과 스타일 - 실제 구글 톤 그대로 유지 */}
      <div className="mb-10">
        <p className="mb-3 text-[13px] font-medium text-ink-hint">Google 검색 결과</p>
        <div className="rounded-lg border border-line p-4 font-arial">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs">
              🌐
            </div>
            <div>
              <p className="text-sm text-gray-800">example.com</p>
              <p className="text-xs text-gray-500">
                https://example.com/contents/{id.slice(0, 8)}
              </p>
            </div>
          </div>
          <p className="mt-1 cursor-pointer text-xl leading-tight text-[#1a0dab] hover:underline">
            {displayTitle}
          </p>
          <p className="mt-1 text-sm leading-snug text-[#4d5156]">
            {displayDescription}
          </p>
        </div>
        <div className="mt-2.5 flex gap-4 text-xs">
          <span className={titleOk ? 'text-ink-hint' : 'text-score-bad'}>
            제목 {displayTitle.length}자 {titleOk ? '✓' : '(60자 초과 ⚠)'}
          </span>
          <span className={descOk ? 'text-ink-hint' : 'text-score-bad'}>
            설명 {displayDescription.length}자 {descOk ? '✓' : '(155자 초과 ⚠)'}
          </span>
        </div>
      </div>

      {/* OG / 소셜 공유 카드 스타일 - 실제 카카오톡/페이스북 톤 그대로 유지 */}
      <div className="mb-10">
        <p className="mb-3 text-[13px] font-medium text-ink-hint">
          소셜 공유 미리보기 (카카오톡/페이스북 등)
        </p>
        <div className="max-w-md overflow-hidden rounded-lg border border-line">
          <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-400">
            대표 이미지 없음
          </div>
          <div className="bg-white p-3">
            <p className="mb-1 text-xs uppercase text-gray-400">example.com</p>
            <p className="text-sm font-bold leading-tight">
              {content.og_title || displayTitle}
            </p>
            <p className="mt-1 text-xs leading-snug text-gray-500">
              {content.og_description || displayDescription}
            </p>
          </div>
        </div>
      </div>

      {/* AEO 답변 카드 - 우리 액센트 컬러로 의미 부여 */}
      {content.ae_answer && (
        <div className="mb-10">
          <p className="mb-3 text-[13px] font-medium text-ink-hint">
            AEO 미리보기 (음성/AI 검색 응답 형태)
          </p>
          <div className="rounded-lg border border-line bg-surface-muted p-4">
            <p className="text-sm font-medium text-ink">
              <span className="text-accent" aria-hidden>
                💬
              </span>{' '}
              {content.ae_answer}
            </p>
          </div>
        </div>
      )}

      {/* GEO 요약 카드 */}
      {content.geo_summary && (
        <div className="mb-10">
          <p className="mb-3 text-[13px] font-medium text-ink-hint">
            GEO 미리보기 (ChatGPT/Perplexity 등 인용 형태)
          </p>
          <div className="rounded-lg border border-line p-4">
            <p className="text-sm leading-relaxed text-ink-secondary">
              {content.geo_summary}
            </p>
            <p className="mt-2 text-xs text-ink-hint">
              출처: {content.title} (example.com)
            </p>
          </div>
        </div>
      )}

      {!content.seo_title && (
        <p className="text-sm text-ink-hint">
          아직 AI 최적화가 실행되지 않았습니다. 콘텐츠 상세 페이지에서 먼저
          최적화를 실행해주세요.
        </p>
      )}
    </div>
  )
}