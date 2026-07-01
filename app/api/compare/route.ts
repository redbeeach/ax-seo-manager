import { NextRequest, NextResponse } from 'next/server'
import { analyzeContent } from '@/lib/score/content-analysis'
import { analyzeCitation } from '@/lib/score/citation-analysis'
import { analyzeReadability } from '@/lib/score/readability-analysis'

interface CompareResult {
  url: string
  label: string
  content_score: number
  citation_score: number
  readability_score: number
  error?: string
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1].trim() : null
}

function extractBodyInner(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return match ? match[1] : html
}

async function crawlAndAnalyze(url: string, label: string): Promise<CompareResult> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return { url, label, content_score: 0, citation_score: 0, readability_score: 0, error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const title = extractTitle(html)
    const body = extractBodyInner(html)

    const content = analyzeContent(body, title)
    const citation = analyzeCitation({ body, title, faqCount: 0, geoSummary: null })
    const readability = analyzeReadability({ body })

    return {
      url,
      label,
      content_score: content.content_score,
      citation_score: citation.citation_score,
      readability_score: readability.readability_score,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return { url, label, content_score: 0, citation_score: 0, readability_score: 0, error: msg }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { competitors } = await request.json() as {
      competitors: { url: string; label: string }[]
    }

    if (!Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json({ error: 'competitors 배열이 필요합니다.' }, { status: 400 })
    }

    if (competitors.length > 3) {
      return NextResponse.json({ error: '최대 3개까지 비교 가능합니다.' }, { status: 400 })
    }

    const results = await Promise.all(
      competitors.map((c) => crawlAndAnalyze(c.url, c.label))
    )

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[compare-error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '비교 분석 실패' },
      { status: 500 }
    )
  }
}