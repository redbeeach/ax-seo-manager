import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { fetchLivePageContent } from '@/lib/gb5/crawl'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    gb5_bo_table,
    gb5_wr_id,
    page_slug,
    canonical_url,
    robots_index,
    robots_follow,
    content_source_mode,
    manual_title,
    manual_body,
    import_from_live,
  } = body

  let title = typeof body.title === 'string' ? body.title.trim() : ''
  let content = typeof body.body === 'string' ? body.body.trim() : ''
  const sourceMode = content_source_mode === 'live' ? 'live' : 'manual'
  const manualTitle = typeof manual_title === 'string' ? manual_title.trim() : title
  const manualBody = typeof manual_body === 'string' ? manual_body.trim() : content

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

  if (import_from_live) {
    try {
      const live = await fetchLivePageContent({ title, page_slug, gb5_bo_table, gb5_wr_id })
      title = live.title
      content = live.text
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : '실제 페이지를 가져오지 못했습니다.' },
        { status: 502 }
      )
    }
  }

  if (!title || !content) {
    return NextResponse.json(
      { error: '제목과 본문을 입력하거나, 실제 페이지에서 가져오기를 선택해주세요.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('contents')
    .insert([{
      title,
      body: content,
      gb5_bo_table,
      gb5_wr_id,
      page_slug,
      canonical_url,
      robots_index,
      robots_follow,
      content_source_mode: sourceMode,
      manual_title: manualTitle || null,
      manual_body: manualBody || null,
    }])
    .select()
    .single()

  if (error) {
    if (error.message.includes('page_slug')) {
      return NextResponse.json(
        { error: '이미 사용 중인 슬러그입니다. 다른 값을 입력해주세요.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
