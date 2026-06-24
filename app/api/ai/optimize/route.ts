import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateScores } from '@/lib/score/calculate'

export async function POST(request: NextRequest) {
  try {
    const { id, title, body } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'title과 body는 필수입니다.' },
        { status: 400 }
      )
    }

    // ⚠️ Mock 데이터 - 실제 AI 연결 전 임시 더미 데이터
    const result = {
      seo_title: `${title} | 완벽 가이드`,
      meta_description: `${title}에 대한 핵심 정보를 한눈에 확인하세요. 전문가가 정리한 실용적인 가이드입니다.`,
      og_title: title,
      og_description: `${title} 관련 알아두면 좋은 정보를 모았습니다.`,
      faq: [
        { question: `${title}란 무엇인가요?`, answer: '본문 내용을 기반으로 한 답변입니다.' },
        { question: '주의할 점은 무엇인가요?', answer: '관련 주의사항을 안내합니다.' },
        { question: '더 자세한 정보는 어디서 볼 수 있나요?', answer: '상세 내용은 본문을 참고하세요.' },
      ],
      ae_answer: `${title}의 핵심은 본문에 정리되어 있습니다.`,
      geo_summary: `${title}에 대한 핵심 요약입니다. 본문 내용을 바탕으로 신뢰할 수 있는 정보를 제공합니다.`,
      json_ld: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: `${title} 관련 콘텐츠`,
        mainEntityOfPage: id ? `https://example.com/contents/${id}` : undefined,
      },
    }

    const scores = calculateScores({
      seo_title: result.seo_title,
      meta_description: result.meta_description,
      og_title: result.og_title,
      og_description: result.og_description,
      faq_json: result.faq,
      ae_answer: result.ae_answer,
      geo_summary: result.geo_summary,
      json_ld: result.json_ld,
    })

    if (id) {
      const { error } = await supabaseAdmin
        .from('contents')
        .update({
          seo_title: result.seo_title,
          meta_description: result.meta_description,
          og_title: result.og_title,
          og_description: result.og_description,
          faq_json: result.faq,
          ae_answer: result.ae_answer,
          geo_summary: result.geo_summary,
          json_ld: result.json_ld,
          seo_score: scores.seo_score,
          aeo_score: scores.aeo_score,
          geo_score: scores.geo_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    }

    return NextResponse.json({ ...result, ...scores })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 최적화 실패' },
      { status: 500 }
    )
  }
}