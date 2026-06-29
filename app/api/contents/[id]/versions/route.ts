// app/api/contents/[id]/versions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// 해당 콘텐츠의 버전 기록 목록 조회 (최신순)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('content_versions')
    .select('*')
    .eq('content_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 버전에 메모(label) 붙이기 - "이게 제일 좋음" 같은 표시용
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { versionId, label } = await request.json()

  if (!versionId) {
    return NextResponse.json({ error: 'versionId는 필수입니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('content_versions')
    .update({ label })
    .eq('id', versionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}