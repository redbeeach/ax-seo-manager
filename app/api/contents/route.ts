import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

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
    title,
    body: content,
    gb5_bo_table,
    gb5_wr_id,
    page_slug,
    canonical_url,
    robots_index,
    robots_follow,
  } = body

  if (!title || !content) {
    return NextResponse.json(
      { error: '제목과 본문은 필수입니다.' },
      { status: 400 }
    )
  }

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
