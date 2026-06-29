import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { analyzeContent } from '@/lib/score/content-analysis'
import { buildCrawlTargetUrl } from '@/lib/gb5/url'

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1].trim() : null
}

function extractBodyInner(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return match ? match[1] : html
}

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

  const liveUrl = buildCrawlTargetUrl(content)

  if (!liveUrl) {
    return NextResponse.json(
      { error: 'page_slug 또는 GB5 게시판 정보(gb5_bo_table/wr_id)가 없어서 크롤링할 실제 페이지 URL을 만들 수 없습니다.' },
      { status: 400 }
    )
  }

  let html: string
  try {
    const res = await fetch(liveUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cache: 'no-store',
      redirect: 'follow',
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `라이브 페이지 응답 오류 (HTTP ${res.status} ${res.statusText})`, url: liveUrl },
        { status: 502 }
      )
    }

    html = await res.text()
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[crawl] fetch 실패:', liveUrl, detail)
    return NextResponse.json(
      { error: `라이브 페이지에 접속할 수 없습니다: ${detail}`, url: liveUrl },
      { status: 502 }
    )
  }

  const liveTitle = extractTitle(html) ?? content.title
  const bodyInner = extractBodyInner(html)
  const analysis = analyzeContent(bodyInner, liveTitle)

  return NextResponse.json({
    url: liveUrl,
    crawled_at: new Date().toISOString(),
    page_title: liveTitle,
    title: liveTitle,
    body: bodyInner,
    content_score: analysis.content_score,
    content_breakdown: analysis.content_breakdown,
    stats: analysis.stats,
  })
}