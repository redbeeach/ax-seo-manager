import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// 목록 조회
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

// 생성
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, body: content } = body

  if (!title || !content) {
    return NextResponse.json(
      { error: 'title과 body는 필수입니다.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('contents')
    .insert([{ title, body: content }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}