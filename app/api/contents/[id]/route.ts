import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { fetchLivePageContent } from '@/lib/gb5/crawl'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const {
    gb5_bo_table,
    gb5_wr_id,
    page_slug,
    import_from_live,
  } = body

  if ((gb5_bo_table || gb5_wr_id) && page_slug) {
    return NextResponse.json(
      { error: 'GB5 게시글 연동과 고정 페이지 슬러그는 동시에 설정할 수 없습니다.' },
      { status: 400 }
    )
  }

  if ((gb5_bo_table && !gb5_wr_id) || (!gb5_bo_table && gb5_wr_id)) {
    return NextResponse.json(
      { error: 'GB5 게시판명과 게시글 번호는 함께 입력해주세요.' },
      { status: 400 }
    )
  }

  const updateBody = { ...body }
  delete updateBody.import_from_live

  if (import_from_live) {
    try {
      const live = await fetchLivePageContent({
        title: typeof updateBody.title === 'string' ? updateBody.title : null,
        page_slug,
        gb5_bo_table,
        gb5_wr_id,
      })
      updateBody.title = live.title
      updateBody.body = live.text
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : '실제 페이지를 가져오지 못했습니다.' },
        { status: 502 }
      )
    }
  }

  if (!updateBody.title || !updateBody.body) {
    return NextResponse.json(
      { error: '제목과 본문을 입력하거나, 실제 페이지에서 가져오기를 선택해주세요.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('contents')
    .update({ ...updateBody, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

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
