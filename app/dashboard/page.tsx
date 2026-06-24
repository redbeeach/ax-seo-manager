import { supabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const { data: contents } = await supabaseAdmin
    .from('contents')
    .select('seo_score, aeo_score, geo_score')

  const total = contents?.length ?? 0

  const avg = (key: 'seo_score' | 'aeo_score' | 'geo_score') => {
    if (!total) return 0
    const sum = contents!.reduce((acc, c) => acc + (c[key] ?? 0), 0)
    return Math.round(sum / total)
  }

  const stats = [
    { label: '전체 콘텐츠 수', value: total },
    { label: '평균 SEO 점수', value: avg('seo_score') },
    { label: '평균 AEO 점수', value: avg('aeo_score') },
    { label: '평균 GEO 점수', value: avg('geo_score') },
  ]

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Link href="/contents" className="text-sm underline">
          콘텐츠 목록 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="border rounded-md p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}