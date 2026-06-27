// app/api/gb5/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// GB5 write_update.php 에서 호출. 메타태그가 아직 없는 글이 작성/수정될 때
// title, body를 AX의 contents 테이블로 동기화(upsert)한다.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-gb5-secret')

  if (secret !== process.env.GB5_SYNC_SECRET) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const body = await req.json()
  const { bo_table, wr_id, title, content } = body

  if (!bo_table || !wr_id || !title) {
    return NextResponse.json(
      { error: 'bo_table, wr_id, title은 필수입니다.' },
      { status: 400 }
    )
  }

  // 같은 게시판/글번호로 이미 동기화된 콘텐츠가 있는지 확인
  const { data: existing } = await supabaseAdmin
    .from('contents')
    .select('id, seo_title')
    .eq('gb5_bo_table', bo_table)
    .eq('gb5_wr_id', wr_id)
    .maybeSingle()

  // 이미 AI 최적화(메타태그)가 적용된 글이면, 본문 동기화로 덮어쓰지 않는다.
  // (AX에서 다듬어놓은 결과를 그누보드 단순 수정으로 깨뜨리지 않기 위함)
  if (existing?.seo_title) {
    return NextResponse.json({
      skipped: true,
      reason: '이미 메타태그가 적용된 콘텐츠라 동기화를 건너뜁니다.',
      id: existing.id,
    })
  }

  if (existing) {
    // 메타태그 없는 상태에서 그누보드 쪽 수정 -> title/body만 갱신
    const { error } = await supabaseAdmin
      .from('contents')
      .update({ title, body: content })
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ updated: true, id: existing.id })
  }

  // 처음 들어온 글 -> 새로 생성
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ created: true, id: created.id })
}