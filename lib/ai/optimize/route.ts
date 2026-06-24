import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/ai/client'
import { buildOptimizePrompt } from '@/lib/ai/prompt'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { id, title, body } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'title과 body는 필수입니다.' },
        { status: 400 }
      )
    }

    const prompt = buildOptimizePrompt(title, body)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('AI 응답을 읽을 수 없습니다.')
    }

    // 혹시 코드블록으로 감싸져 오면 제거
    const cleaned = textBlock.text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    // id가 있으면 바로 DB에 저장
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 최적화 실패' },
      { status: 500 }
    )
  }
}