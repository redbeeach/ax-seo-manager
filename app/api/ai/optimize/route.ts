import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateScores } from '@/lib/score/calculate'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'AX SEO Manager'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
const AUTHOR_NAME = process.env.NEXT_PUBLIC_AUTHOR_NAME || '관리자'
const AUTHOR_JOB_TITLE = process.env.NEXT_PUBLIC_AUTHOR_JOB_TITLE || ''

interface AiResult {
  seo_title: string
  meta_description: string
  og_title: string
  og_description: string
  faq: { question: string; answer: string }[]
  ae_answer: string
  geo_summary: string
}

async function callOpenAI(title: string, body: string): Promise<AiResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되어 있지 않습니다.')
  }

  const systemPrompt = `당신은 SEO/AEO/GEO 최적화 전문가입니다.
주어진 글의 제목과 본문을 분석해서 아래 JSON 형식으로만 답변하세요.

{
  "seo_title": "60자 이내, 핵심 키워드를 포함한 검색엔진용 제목",
  "meta_description": "155자 이내, 클릭을 유도하는 요약 설명",
  "og_title": "소셜 공유용 제목 (제목과 비슷해도 됨)",
  "og_description": "소셜 공유용 설명",
  "faq": [
    { "question": "본문 내용 기반 질문 1", "answer": "본문 내용을 바탕으로 한 답변" },
    { "question": "본문 내용 기반 질문 2", "answer": "본문 내용을 바탕으로 한 답변" },
    { "question": "본문 내용 기반 질문 3", "answer": "본문 내용을 바탕으로 한 답변" }
  ],
  "ae_answer": "음성/AI 검색 응답에 쓸 한 줄 핵심 답변 (50자 내외)",
  "geo_summary": "ChatGPT/Perplexity 같은 생성형 AI가 인용하기 좋은 50자 이상의 핵심 요약문"
}`

  const userPrompt = `제목: ${title}\n\n본문:\n${body}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API 오류 (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI 응답에서 내용을 찾을 수 없습니다.')
  }

  let parsed: AiResult
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('AI 응답을 JSON으로 해석하지 못했습니다.')
  }

  return parsed
}

export async function POST(request: NextRequest) {
  try {
    const { id, title, body } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'title과 body는 필수입니다.' },
        { status: 400 }
      )
    }

    let publishedAt = new Date().toISOString()
    if (id) {
      const { data: existing } = await supabaseAdmin
        .from('contents')
        .select('created_at')
        .eq('id', id)
        .single()
      if (existing?.created_at) {
        publishedAt = existing.created_at
      }
    }
    const modifiedAt = new Date().toISOString()
    const pageUrl = id ? `${SITE_URL}/contents/${id}` : SITE_URL

    const aiResult = await callOpenAI(title, body)

    const json_ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: aiResult.meta_description,
      datePublished: publishedAt,
      dateModified: modifiedAt,
      author: {
        '@type': 'Person',
        name: AUTHOR_NAME,
        ...(AUTHOR_JOB_TITLE ? { jobTitle: AUTHOR_JOB_TITLE } : {}),
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      url: pageUrl,
      mainEntityOfPage: pageUrl,
    }

    const scores = calculateScores({
      seo_title: aiResult.seo_title,
      meta_description: aiResult.meta_description,
      og_title: aiResult.og_title,
      og_description: aiResult.og_description,
      faq_json: aiResult.faq,
      ae_answer: aiResult.ae_answer,
      geo_summary: aiResult.geo_summary,
      json_ld,
    })

    if (id) {
      const { error } = await supabaseAdmin
        .from('contents')
        .update({
          seo_title: aiResult.seo_title,
          meta_description: aiResult.meta_description,
          og_title: aiResult.og_title,
          og_description: aiResult.og_description,
          faq_json: aiResult.faq,
          ae_answer: aiResult.ae_answer,
          geo_summary: aiResult.geo_summary,
          json_ld,
          seo_score: scores.seo_score,
          aeo_score: scores.aeo_score,
          geo_score: scores.geo_score,
          updated_at: modifiedAt,
        })
        .eq('id', id)

      if (error) throw error
    }

    return NextResponse.json({ ...aiResult, json_ld, ...scores })
  } catch (err) {
    console.error('[ai-optimize-error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 최적화 실패' },
      { status: 500 }
    )
  }
}