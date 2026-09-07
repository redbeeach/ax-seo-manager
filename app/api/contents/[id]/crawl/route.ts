import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { analyzeContent } from '@/lib/score/content-analysis'
import { fetchLivePageContent } from '@/lib/gb5/crawl'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: content, error } = await supabaseAdmin
    .from('contents')
    .select('id, title, canonical_url, page_slug, gb5_bo_table, gb5_wr_id')
    .eq('id', id)
    .single()

  if (error || !content) {
    return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
  }

  let live
  try {
    live = await fetchLivePageContent(content)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[crawl] fetch 실패:', detail)
    return NextResponse.json(
      { error: `실제 페이지에 접속할 수 없습니다: ${detail}` },
      { status: 502 }
    )
  }

  const analysis = analyzeContent(live.body, live.title)
  const crawledAt = new Date().toISOString()

  await supabaseAdmin
    .from('content_live_analyses')
    .upsert(
      {
        content_id: id,
        url: live.url,
        crawled_at: crawledAt,
        content_score: analysis.content_score,
        content_breakdown: analysis.content_breakdown,
        content_stats: analysis.stats,
      },
      { onConflict: 'content_id' }
    )

  return NextResponse.json({
    url: live.url,
    crawled_at: crawledAt,
    page_title: live.title,
    title: live.title,
    body: live.body,
    content_score: analysis.content_score,
    content_breakdown: analysis.content_breakdown,
    stats: analysis.stats,
  })
}
