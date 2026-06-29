import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

interface AiEntityResult {
  entities: string[]
  topic: string
  related_terms: string[]
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

async function callOpenAI(title: string, plainText: string): Promise<AiEntityResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되어 있지 않습니다.')
  }

  const systemPrompt = `당신은 콘텐츠의 Entity(개체)와 주제를 분석하는 전문가입니다.
주어진 글의 제목과 본문을 분석해서 아래 JSON 형식으로만 답변하세요. 다른 설명은 절대 붙이지 마세요.

{
  "entities": ["본문에 실제로 등장하는 핵심 개체명(인물/조직/장소/제품/연도 등) 5~10개"],
  "topic": "이 글의 핵심 주제를 한 단어 또는 짧은 구로",
  "related_terms": ["이 주제를 다룬 글이라면 자연스럽게 등장해야 할 연관 단어 6~10개 (본문에 실제로 있는지 여부와 무관하게, 주제 기준으로 기대되는 단어)"]
}

entities는 본문에서 실제로 언급된 단어만 추출하세요. related_terms는 추측 기반 기대 단어이므로 본문에 없어도 됩니다.`

  const userPrompt = `제목: ${title}\n\n본문:\n${plainText.slice(0, 4000)}`

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

  let parsed: AiEntityResult
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('AI 응답을 JSON으로 해석하지 못했습니다.')
  }

  if (!Array.isArray(parsed.entities)) parsed.entities = []
  if (!Array.isArray(parsed.related_terms)) parsed.related_terms = []
  if (typeof parsed.topic !== 'string') parsed.topic = ''

  return parsed
}

export async function POST(request: NextRequest) {
  try {
    const { id, title, body } = await request.json()

    let resolvedTitle = title
    let resolvedBody = body

    if (id && (!resolvedTitle || !resolvedBody)) {
      const { data, error } = await supabaseAdmin
        .from('contents')
        .select('title, body')
        .eq('id', id)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 })
      }
      resolvedTitle = data.title
      resolvedBody = data.body
    }

    if (!resolvedTitle || !resolvedBody) {
      return NextResponse.json({ error: 'title과 body(또는 id)가 필요합니다.' }, { status: 400 })
    }

    const plainText = stripTags(resolvedBody)
    const aiResult = await callOpenAI(resolvedTitle, plainText)

    // 관련어가 실제 본문에 포함되는지는 AI 추측이 아니라 코드로 직접 검사 (정확도 보장)
    const lowerPlainText = plainText.toLowerCase()
    const coverage = aiResult.related_terms.map((term) => ({
      term,
      covered: lowerPlainText.includes(term.toLowerCase()),
    }))
    const coveredCount = coverage.filter((c) => c.covered).length
    const coverageRatio = coverage.length > 0 ? coveredCount / coverage.length : 0

    return NextResponse.json({
      entities: aiResult.entities,
      topic: aiResult.topic,
      related_terms_coverage: coverage,
      covered_count: coveredCount,
      total_count: coverage.length,
      coverage_ratio: coverageRatio,
    })
  } catch (err) {
    console.error('[ai-entity-semantic-error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Entity/Semantic 분석 실패' },
      { status: 500 }
    )
  }
}