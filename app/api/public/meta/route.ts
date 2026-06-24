import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const boTable = url.searchParams.get('bo_table')
  const wrId = url.searchParams.get('wr_id')

  let query = supabaseAdmin
    .from('contents')
    .select('seo_title, meta_description, og_title, og_description, json_ld')

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

  return NextResponse.json(data, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}