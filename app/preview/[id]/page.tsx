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

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">검색결과 미리보기</h1>
        <Link href={`/contents/${id}`} className="text-sm underline">
          ← 콘텐츠로 돌아가기
        </Link>
      </div>

      {/* Google 검색결과 스타일 */}
      <div className="mb-10">
        <p className="text-xs text-gray-500 mb-2">Google 검색 결과</p>
        <div className="border rounded-lg p-4 font-arial">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs">
              🌐
            </div>
            <div>
              <p className="text-sm text-gray-800">example.com</p>
              <p className="text-xs text-gray-500">
                https://example.com/contents/{id.slice(0, 8)}
              </p>
            </div>
          </div>
          <p className="text-[#1a0dab] text-xl leading-tight mt-1 hover:underline cursor-pointer">
            {displayTitle}
          </p>
          <p className="text-sm text-[#4d5156] mt-1 leading-snug">
            {displayDescription}
          </p>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>제목 {displayTitle.length}자 {displayTitle.length > 60 ? '(60자 초과 ⚠️)' : '✓'}</span>
          <span>설명 {displayDescription.length}자 {displayDescription.length > 155 ? '(155자 초과 ⚠️)' : '✓'}</span>
        </div>
      </div>

      {/* OG / 소셜 공유 카드 스타일 */}
      <div className="mb-10">
        <p className="text-xs text-gray-500 mb-2">소셜 공유 미리보기 (카카오톡/페이스북 등)</p>
        <div className="border rounded-lg overflow-hidden max-w-md">
          <div className="bg-gray-100 h-40 flex items-center justify-center text-gray-400 text-sm">
            대표 이미지 없음
          </div>
          <div className="p-3 bg-white">
            <p className="text-xs text-gray-400 uppercase mb-1">example.com</p>
            <p className="font-bold text-sm leading-tight">
              {content.og_title || displayTitle}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              {content.og_description || displayDescription}
            </p>
          </div>
        </div>
      </div>

      {/* AEO 답변 카드 (AI 검색엔진 응답 스타일) */}
      {content.ae_answer && (
        <div className="mb-10">
          <p className="text-xs text-gray-500 mb-2">
            AEO 미리보기 (음성/AI 검색 응답 형태)
          </p>
          <div className="border rounded-lg p-4 bg-indigo-50">
            <p className="text-sm font-medium text-indigo-900">
              💬 {content.ae_answer}
            </p>
          </div>
        </div>
      )}

      {/* GEO 요약 카드 (생성형 AI 인용 형태) */}
      {content.geo_summary && (
        <div className="mb-10">
          <p className="text-xs text-gray-500 mb-2">
            GEO 미리보기 (ChatGPT/Perplexity 등 인용 형태)
          </p>
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-700 leading-relaxed">
              {content.geo_summary}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              출처: {content.title} (example.com)
            </p>
          </div>
        </div>
      )}

      {!content.seo_title && (
        <p className="text-gray-400 text-sm">
          아직 AI 최적화가 실행되지 않았습니다. 콘텐츠 상세 페이지에서 먼저
          최적화를 실행해주세요.
        </p>
      )}
    </div>
  )
}