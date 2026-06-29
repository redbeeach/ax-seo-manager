// app/api/contents/[id]/versions/[versionId]/restore/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// 선택한 버전의 내용을 contents 테이블 본체로 복원
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params

  const { data: version, error: fetchError } = await supabaseAdmin
    .from('content_versions')
    .select('*')
    .eq('id', versionId)
    .eq('content_id', id)
    .single()

  if (fetchError || !version) {
    return NextResponse.json({ error: '버전을 찾을 수 없습니다.' }, { status: 404 })
  }

  const { error: updateError } = await supabaseAdmin
    .from('contents')
    .update({
      seo_title: version.seo_title,
      meta_description: version.meta_description,
      og_title: version.og_title,
      og_description: version.og_description,
      faq_json: version.faq_json,
      ae_answer: version.ae_answer,
      geo_summary: version.geo_summary,
      json_ld: version.json_ld,
      seo_score: version.seo_score,
      aeo_score: version.aeo_score,
      geo_score: version.geo_score,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}