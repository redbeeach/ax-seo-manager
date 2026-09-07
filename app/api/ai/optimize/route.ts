import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateScores } from '@/lib/score/calculate'
import { fetchLivePageContent } from '@/lib/gb5/crawl'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'AX SEO Manager'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
const AUTHOR_NAME = process.env.NEXT_PUBLIC_AUTHOR_NAME || '관리자'
const AUTHOR_JOB_TITLE = process.env.NEXT_PUBLIC_AUTHOR_JOB_TITLE || ''
const GB5_URL = process.env.NEXT_PUBLIC_GB5_URL || ''
const GB5_SUBPAGE_PATH = process.env.NEXT_PUBLIC_GB5_SUBPAGE_PATH ?? '/sub'
const OG_IMAGE_URL = process.env.NEXT_PUBLIC_OG_IMAGE_URL || (GB5_URL ? `${GB5_URL}/page/images/sum.png` : '')

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
주어진 페이지 제목과 본문을 분석해서 아래 JSON 형식으로만 답하세요.

{
  "seo_title": "검색엔진용 제목. 60자 이내. 핵심 키워드 포함",
  "meta_description": "검색 결과에 노출될 요약 설명. 155자 이내",
  "og_title": "소셜 공유용 제목",
  "og_description": "소셜 공유용 설명",
  "faq": [
    { "question": "본문 기반 질문 1", "answer": "본문 기반 답변 1" },
    { "question": "본문 기반 질문 2", "answer": "본문 기반 답변 2" },
    { "question": "본문 기반 질문 3", "answer": "본문 기반 답변 3" }
  ],
  "ae_answer": "AI 검색 답변에 바로 쓰기 좋은 핵심 답변. 50자 이상",
  "geo_summary": "생성형 AI가 인용하기 좋은 객관적 요약. 50자 이상"
}`

  const userPrompt = `제목: ${title}\n\n본문:\n${body}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
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

  try {
    return JSON.parse(content) as AiResult
  } catch {
    throw new Error('AI 응답을 JSON으로 해석하지 못했습니다.')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, title, body, source } = await request.json()
    let sourceTitle = typeof title === 'string' ? title : ''
    let sourceBody = typeof body === 'string' ? body : ''
    let sourceUrl: string | null = null

    let publishedAt = new Date().toISOString()
    let pageUrl = id ? `${SITE_URL}/contents/${id}` : SITE_URL
    let existing: Record<string, any> | null = null

    if (id) {
      const { data } = await supabaseAdmin
        .from('contents')
        .select('created_at, gb5_bo_table, gb5_wr_id, page_slug')
        .eq('id', id)
        .single()

      existing = data

      if (existing?.created_at) {
        publishedAt = new Date(existing.created_at).toISOString()
      }

      if (existing?.gb5_bo_table && existing?.gb5_wr_id && GB5_URL) {
        pageUrl = `${GB5_URL}/bbs/board.php?bo_table=${existing.gb5_bo_table}&wr_id=${existing.gb5_wr_id}`
      } else if (existing?.page_slug && GB5_URL) {
        pageUrl = `${GB5_URL}${GB5_SUBPAGE_PATH}/${existing.page_slug}.php`
      }
    }

    if (source === 'live') {
      if (!id || !existing) {
        return NextResponse.json(
          { error: '실제 페이지 기준 최적화는 저장된 콘텐츠에서만 사용할 수 있습니다.' },
          { status: 400 }
        )
      }

      const live = await fetchLivePageContent({ title: sourceTitle, ...existing })
      sourceTitle = live.title
      sourceBody = live.text
      sourceUrl = live.url
      pageUrl = live.url
    }

    if (!sourceTitle || !sourceBody) {
      return NextResponse.json(
        { error: '최적화할 제목과 본문을 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    const modifiedAt = new Date().toISOString()
    const aiResult = await callOpenAI(sourceTitle, sourceBody)

    const json_ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: sourceTitle,
      description: aiResult.meta_description,
      datePublished: publishedAt,
      dateModified: modifiedAt,
      author: {
        '@type': 'Person',
        name: AUTHOR_NAME,
        ...(AUTHOR_JOB_TITLE ? { jobTitle: AUTHOR_JOB_TITLE } : {}),
        ...(GB5_URL ? { url: GB5_URL } : {}),
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      url: pageUrl,
      mainEntityOfPage: pageUrl,
      ...(OG_IMAGE_URL ? { image: OG_IMAGE_URL } : {}),
    }

    const scores = calculateScores({
      title: sourceTitle,
      seo_title: aiResult.seo_title,
      meta_description: aiResult.meta_description,
      og_title: aiResult.og_title,
      og_description: aiResult.og_description,
      faq_json: aiResult.faq,
      ae_answer: aiResult.ae_answer,
      geo_summary: aiResult.geo_summary,
      json_ld,
      body: sourceBody,
    })

    if (id) {
      const { error } = await supabaseAdmin
        .from('contents')
        .update({
          title: sourceTitle,
          body: sourceBody,
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

      try {
        await supabaseAdmin.from('content_versions').insert({
          content_id: id,
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
        })
      } catch (versionErr) {
        console.error('[content-version-save-error]', versionErr)
      }
    }

    return NextResponse.json({ ...aiResult, json_ld, ...scores, source_url: sourceUrl })
  } catch (err) {
    console.error('[ai-optimize-error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 최적화에 실패했습니다.' },
      { status: 500 }
    )
  }
}
