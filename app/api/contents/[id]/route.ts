import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// 단건 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

// 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  if ((body.gb5_bo_table || body.gb5_wr_id) && body.page_slug) {
    return NextResponse.json(
      { error: 'GB5 게시글 연동과 고정 페이지 슬러그는 동시에 설정할 수 없습니다.' },
      { status: 400 }
    )
  }

  if ((body.gb5_bo_table && !body.gb5_wr_id) || (!body.gb5_bo_table && body.gb5_wr_id)) {
    return NextResponse.json(
      { error: 'GB5 게시판명과 게시글 번호는 함께 입력해주세요.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('contents')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabaseAdmin
    .from('contents')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
