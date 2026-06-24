import { supabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ContentsListPage() {
  const { data: contents, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">콘텐츠 목록</h1>
        <Link
          href="/contents/new"
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          + 새 글
        </Link>
      </div>

      {error && <p className="text-red-500">목록을 불러오지 못했습니다.</p>}

      <ul className="space-y-3">
        {contents?.map((c) => (
          <li key={c.id} className="border rounded-md p-4">
            <Link href={`/contents/${c.id}`} className="font-medium hover:underline">
              {c.title}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              SEO {c.seo_score} · AEO {c.aeo_score} · GEO {c.geo_score}
            </p>
          </li>
        ))}
      </ul>

      {contents?.length === 0 && (
        <p className="text-gray-400 text-center mt-12">아직 작성된 콘텐츠가 없습니다.</p>
      )}
    </div>
  )
}