import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { analyzeKeywords } from '@/lib/keywords/analyze'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const boTable = url.searchParams.get('bo_table')
  const wrId = url.searchParams.get('wr_id')

  let query = supabaseAdmin
    .from('contents')
    .select('title, body, seo_title, meta_description, og_title, og_description, json_ld')

  if (id) {
    query = query.eq('id', id)
  } else if (boTable && wrId) {
    query = query.eq('gb5_bo_table', boTable).eq('gb5_wr_id', wrId)
  } else {
    return NextResponse.json(
      { error: 'id 또는 bo_table+wr_id가 필요합니다.' },
      { status: 400 }
    )
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
  }

  // meta keywords: 키워드 분석 결과(주요+보조)를 합쳐서 콤마로 구분된 문자열로 생성
  const { primary, secondary } = analyzeKeywords(data.title ?? '', data.body ?? '')
  const keywords = [...primary, ...secondary.map((k) => k.word)]
    .filter((w, i, arr) => arr.indexOf(w) === i) // 중복 제거
    .slice(0, 10)
    .join(',')

  return NextResponse.json(
    {
      seo_title: data.seo_title,
      meta_description: data.meta_description,
      og_title: data.og_title,
      og_description: data.og_description,
      json_ld: data.json_ld,
      keywords,
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  )
}