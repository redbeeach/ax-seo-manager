import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import AiOptimizeButton from '@/components/AiOptimizeButton'
import { calculateScores } from '@/lib/score/calculate'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const { data: content } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

  if (!content) return {}

  return {
    title: content.seo_title || content.title,
    description: content.meta_description || undefined,
    openGraph: {
      title: content.og_title || content.title,
      description: content.og_description || undefined,
    },
  }
}

export default async function ContentDetailPage({
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

  const scores = calculateScores({
    seo_title: content.seo_title,
    meta_description: content.meta_description,
    og_title: content.og_title,
    og_description: content.og_description,
    faq_json: content.faq_json,
    ae_answer: content.ae_answer,
    geo_summary: content.geo_summary,
    json_ld: content.json_ld,
  })

  return (
  <>
    {content.json_ld && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(content.json_ld) }}/>
      
    )}
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <div className="flex gap-2">
        <Link
            href={`/preview/${id}`}
            className="border px-4 py-2 rounded-md text-sm"
        >
            미리보기
        </Link>
        <Link
            href={`/contents/${id}/edit`}
            className="border px-4 py-2 rounded-md text-sm"
        >
            수정
        </Link>
        <DeleteButton id={id} />
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        SEO {content.seo_score} · AEO {content.aeo_score} · GEO {content.geo_score}
      </p>

      <AiOptimizeButton id={id} title={content.title} body={content.body} />

      {content.seo_title && (
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div>
            <p className="font-semibold mb-1">SEO {scores.seo_score}점</p>
            <ul className="space-y-0.5 text-gray-600">
              {scores.seo_breakdown.map((item, i) => (
                <li key={i} className={item.passed ? '' : 'text-red-400'}>
                  {item.passed ? '✓' : '✗'} {item.label} ({item.points}pt)
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">AEO {scores.aeo_score}점</p>
            <ul className="space-y-0.5 text-gray-600">
              {scores.aeo_breakdown.map((item, i) => (
                <li key={i} className={item.passed ? '' : 'text-red-400'}>
                  {item.passed ? '✓' : '✗'} {item.label} ({item.points}pt)
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">GEO {scores.geo_score}점</p>
            <ul className="space-y-0.5 text-gray-600">
              {scores.geo_breakdown.map((item, i) => (
                <li key={i} className={item.passed ? '' : 'text-red-400'}>
                  {item.passed ? '✓' : '✗'} {item.label} ({item.points}pt)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="whitespace-pre-wrap mb-8">{content.body}</div>

      {content.seo_title && (
        <div className="border-t pt-6 space-y-6">
          <h2 className="font-bold text-lg">AI 최적화 결과</h2>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-1">SEO Title</h3>
            <p>{content.seo_title}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-1">Meta Description</h3>
            <p>{content.meta_description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-1">OG Title / Description</h3>
            <p>{content.og_title}</p>
            <p className="text-gray-600">{content.og_description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-1">FAQ</h3>
            <ul className="space-y-2">
              {content.faq_json?.map((faq: { question: string; answer: string }, i: number) => (
                <li key={i}>
                  <p className="font-medium">Q. {faq.question}</p>
                  <p className="text-gray-600">A. {faq.answer}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-1">AEO 한 줄 답변</h3>
            <p>{content.ae_answer}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-1">GEO 요약</h3>
            <p>{content.geo_summary}</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 mb-1">JSON-LD</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
              {JSON.stringify(content.json_ld, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
    </>
  )
}