// app/api/gb5/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-gb5-secret')

  if (secret !== process.env.GB5_SYNC_SECRET) {
    console.log('[gb5-sync-debug] 401 - secret mismatch')
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch (e) {
    console.log('[gb5-sync-debug] json parse error:', e)
    return NextResponse.json({ error: 'JSON 파싱 실패' }, { status: 400 })
  }

  console.log('[gb5-sync-debug] body:', JSON.stringify(body))

  const { bo_table, wr_id, title, content } = body

  if (!bo_table || !wr_id || !title) {
    console.log('[gb5-sync-debug] 400 - missing fields', { bo_table, wr_id, title })
    return NextResponse.json(
      { error: 'bo_table, wr_id, title은 필수입니다.' },
      { status: 400 }
    )
  }

  const { data: existing, error: selectError } = await supabaseAdmin
    .from('contents')
    .select('id, seo_title')
    .eq('gb5_bo_table', bo_table)
    .eq('gb5_wr_id', wr_id)
    .maybeSingle()

  console.log('[gb5-sync-debug] existing:', JSON.stringify(existing), 'selectError:', JSON.stringify(selectError))

  if (existing?.seo_title) {
    console.log('[gb5-sync-debug] skipped - already optimized')
    return NextResponse.json({
      skipped: true,
      reason: '이미 메타태그가 적용된 콘텐츠라 동기화를 건너뜁니다.',
      id: existing.id,
    })
  }

  if (existing) {
    const { error } = await supabaseAdmin
      .from('contents')
      .update({ title, body: content })
      .eq('id', existing.id)

    console.log('[gb5-sync-debug] update error:', JSON.stringify(error))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ updated: true, id: existing.id })
  }

  const { data: created, error } = await supabaseAdmin
    .from('contents')
    .insert({
      title,
      body: content,
      gb5_bo_table: bo_table,
      gb5_wr_id: wr_id,
    })
    .select('id')
    .single()

  console.log('[gb5-sync-debug] insert created:', JSON.stringify(created), 'error:', JSON.stringify(error))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ created: true, id: created.id })
}