import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { analyzeKeywords } from '@/lib/keywords/analyze'
import { buildLiveUrl } from '@/lib/gb5/url'

const AUTHOR_NAME = process.env.NEXT_PUBLIC_AUTHOR_NAME || '관리자'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

type PublicMetaContent = {
  title: string | null
  body: string | null
  seo_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  json_ld: JsonValue | null
  canonical_url: string | null
  robots_index: boolean | null
  robots_follow: boolean | null
  page_slug: string | null
  gb5_bo_table: string | null
  gb5_wr_id: string | number | null
}

function getAuthorName(jsonLd: JsonValue | null) {
  if (!jsonLd || typeof jsonLd !== 'object' || Array.isArray(jsonLd)) return AUTHOR_NAME
  const author = jsonLd.author
  if (!author || typeof author !== 'object' || Array.isArray(author)) return AUTHOR_NAME
  return typeof author.name === 'string' ? author.name : AUTHOR_NAME
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const boTable = url.searchParams.get('bo_table')
  const wrId = url.searchParams.get('wr_id')
  const slug = url.searchParams.get('slug')

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

  const content = data as PublicMetaContent
  const { primary, secondary } = analyzeKeywords(content.title ?? '', content.body ?? '')
  const keywords = [...primary, ...secondary.map((k) => k.word)]
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 10)
    .join(',')

  const canonicalUrl = buildLiveUrl(content)
  const robotsIndex = content.robots_index !== false
  const robotsFollow = content.robots_follow !== false
  const robotsContent = `${robotsIndex ? 'index' : 'noindex'},${robotsFollow ? 'follow' : 'nofollow'}`

  return NextResponse.json(
    {
      seo_title: content.seo_title,
      meta_description: content.meta_description,
      og_title: content.og_title,
      og_description: content.og_description,
      json_ld: content.json_ld,
      keywords,
      author: getAuthorName(content.json_ld),
      canonical_url: canonicalUrl,
      robots: robotsContent,
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  )
}
