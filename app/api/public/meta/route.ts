import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { analyzeKeywords } from '@/lib/keywords/analyze'
import { buildLiveUrl } from '@/lib/gb5/url'

const AUTHOR_NAME = process.env.NEXT_PUBLIC_AUTHOR_NAME || '관리자'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const boTable = url.searchParams.get('bo_table')
  const wrId = url.searchParams.get('wr_id')
  const slug = url.searchParams.get('slug') // 고정 페이지(회사소개, 오시는길 등) 식별자

  let query = supabaseAdmin
    .from('contents')
    .select(
      'title, body, seo_title, meta_description, og_title, og_description, json_ld, canonical_url, robots_index, robots_follow, page_slug, gb5_bo_table, gb5_wr_id'
    )

  if (id) {
    query = query.eq('id', id)
  } else if (boTable && wrId) {
    query = query.eq('gb5_bo_table', boTable).eq('gb5_wr_id', wrId)
  } else if (slug) {
    query = query.eq('page_slug', slug)
  } else {
    return NextResponse.json(
      { error: 'id, slug, 또는 bo_table+wr_id가 필요합니다.' },
      { status: 400 }
    )
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
  }

  const { primary, secondary } = analyzeKeywords(data.title ?? '', data.body ?? '')
  const keywords = [...primary, ...secondary.map((k) => k.word)]
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 10)
    .join(',')

  const jsonLd = data.json_ld as Record<string, any> | null
  const authorName = jsonLd?.author?.name || AUTHOR_NAME

  const canonicalUrl = buildLiveUrl(data)
  const robotsIndex = data.robots_index !== false
  const robotsFollow = data.robots_follow !== false
  const robotsContent = `${robotsIndex ? 'index' : 'noindex'},${robotsFollow ? 'follow' : 'nofollow'}`

  return NextResponse.json(
    {
      seo_title: data.seo_title,
      meta_description: data.meta_description,
      og_title: data.og_title,
      og_description: data.og_description,
      json_ld: data.json_ld,
      keywords,
      author: authorName,
      canonical_url: canonicalUrl,
      robots: robotsContent,
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  )
}