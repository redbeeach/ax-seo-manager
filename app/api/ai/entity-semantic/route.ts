import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

type EntityType = 'Person' | 'Organization' | 'Location' | 'Technology' | 'Product' | 'Event' | 'Other'

interface EntityItem {
  name: string
  type: EntityType
}

interface RelatedTerm {
  term: string
  reason: string
}

interface AiEntityResult {
  entities: EntityItem[]
  topic: string
  related_terms: RelatedTerm[]
}

// ── 룰베이스 사전 추출 ──────────────────────────────────────
function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTagTexts(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  const results: string[] = []
  let m
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1]).trim()
    if (text.length > 0) results.push(text)
  }
  return results
}

function topTfWords(plainText: string, topN = 20): string[] {
  const words = plainText
    .split(/[\s\n\t,.\(\)\[\]{}!?;:"']+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2)

  const freq: Record<string, number> = {}
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w)
}

function extractAnchors(html: string): string[] {
  const anchors = html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) ?? []
  return anchors.map((a) => stripTags(a).trim()).filter((t) => t.length >= 2)
}

function rulebBaseHints(title: string, html: string): string {
  const plain = stripTags(html)
  const h1s = extractTagTexts(html, 'h1')
  const h2s = extractTagTexts(html, 'h2')
  const anchors = extractAnchors(html).slice(0, 15)
  const tf = topTfWords(plain)

  const lines = [
    `제목: ${title}`,
    h1s.length > 0 ? `H1: ${h1s.join(' / ')}` : '',
    h2s.length > 0 ? `H2: ${h2s.slice(0, 6).join(' / ')}` : '',
    tf.length > 0 ? `자주 등장하는 단어(TF): ${tf.join(', ')}` : '',
    anchors.length > 0 ? `링크 앵커 텍스트: ${anchors.join(', ')}` : '',
  ].filter(Boolean)

  return lines.join('\n')
}

// ── OpenAI 호출 ───────────────────────────────────────────────
async function callOpenAI(title: string, html: string): Promise<AiEntityResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY가 설정되어 있지 않습니다.')

  const plainText = stripTags(html)
  const hints = rulebBaseHints(title, html)

  const systemPrompt = `당신은 SEO와 콘텐츠 분석 전문가입니다.
아래 사전 추출된 힌트와 본문을 바탕으로 JSON만 반환하세요. 다른 말 금지.

{
  "entities": [
    { "name": "엔티티명", "type": "Person|Organization|Location|Technology|Product|Event|Other" }
  ],
  "topic": "핵심 주제 (한 단어 또는 짧은 구)",
  "related_terms": [
    { "term": "관련 단어", "reason": "이 단어가 왜 필요한지 한 줄 이유 (20자 이내)" }
  ]
}

규칙:
- entities: 본문에 실제 등장하는 고유 개체만 5~10개, 중요도 순 정렬
- topic: 이 글의 핵심 주제 하나
- related_terms: 이 주제의 글이라면 자연스럽게 포함되어야 할 단어 6~10개 (본문에 없어도 됨)
- reason은 한국어로 20자 이내`

  const userPrompt = `[사전 추출 힌트]\n${hints}\n\n[본문 일부]\n${plainText.slice(0, 3000)}`

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
    const err = await response.text()
    throw new Error(`OpenAI API 오류 (${response.status}): ${err}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('AI 응답에서 내용을 찾을 수 없습니다.')

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

// ── Route Handler ─────────────────────────────────────────────
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

    const aiResult = await callOpenAI(resolvedTitle, resolvedBody)

    // Semantic 포함 여부: AI 추측 아닌 코드로 직접 검사
    const lowerPlain = stripTags(resolvedBody).toLowerCase()
    const coverage = aiResult.related_terms.map((rt) => ({
      term: rt.term,
      reason: rt.reason,
      covered: lowerPlain.includes(rt.term.toLowerCase()),
    }))
    const coveredCount = coverage.filter((c) => c.covered).length
    const coverageRatio = coverage.length > 0 ? coveredCount / coverage.length : 0

    const result = {
      entities: aiResult.entities,
      topic: aiResult.topic,
      related_terms_coverage: coverage,
      covered_count: coveredCount,
      total_count: coverage.length,
      coverage_ratio: coverageRatio,
    }

    // content_id 있으면 분석 결과 DB에 저장 (새로고침 후에도 유지)
    if (id) {
      const isLive = !!(title && body) // title+body 직접 전달 = 크롤링된 Live 데이터
      await supabaseAdmin
        .from('content_entity_analyses')
        .upsert(
          {
            content_id: id,
            analyzed_at: new Date().toISOString(),
            is_live: isLive,
            topic: result.topic,
            entities: result.entities,
            related_terms_coverage: result.related_terms_coverage,
            covered_count: result.covered_count,
            total_count: result.total_count,
            coverage_ratio: result.coverage_ratio,
          },
          { onConflict: 'content_id' }
        )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[ai-entity-semantic-error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Entity/Semantic 분석 실패' },
      { status: 500 }
    )
  }
}