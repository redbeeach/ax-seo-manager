interface ScoreBreakdownItem {
  label: string
  points: number
  passed: boolean
}

export interface CitationAnalysisResult {
  citation_score: number
  citation_breakdown: ScoreBreakdownItem[]
  stats: {
    hasTable: boolean
    hasList: boolean
    hasFaq: boolean
    hasSummary: boolean
    hasExternalSource: boolean
    hasDefinition: boolean
  }
}

interface CitationInput {
  body: string | null
  title?: string | null
  faqCount: number
  geoSummary?: string | null
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function hasTableTag(html: string): boolean {
  return /<table\b/i.test(html)
}

function hasListTag(html: string): boolean {
  return /<ul\b|<ol\b/i.test(html)
}

function hasExternalSourceLink(html: string, ownDomainHint = 'hby1126hh.mycafe24.com'): boolean {
  const anchorTags = html.match(/<a\b[^>]*href\s*=\s*["'][^"']*["'][^>]*>/gi) ?? []
  return anchorTags.some((tag) => {
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']*)["']/i)
    if (!hrefMatch) return false
    const href = hrefMatch[1].trim()
    return /^https?:\/\//i.test(href) && !href.includes(ownDomainHint)
  })
}

// 본문 도입부에 "~란", "~이란", "~는 무엇", "정의" 등 정의문 패턴이 있는지 검사하는 휴리스틱.
// 완벽하진 않지만 정의문이 보통 글 도입부에 등장한다는 점을 활용한 1차 필터.
function hasDefinitionPattern(plainText: string, title?: string | null): boolean {
  const intro = plainText.slice(0, 400)
  const titleWord = title ? title.trim().split(/\s+/)[0] : ''

  const patterns = [
    /[가-힣A-Za-z0-9]+(이)?란\s/,
    /[가-힣A-Za-z0-9]+(은|는)\s+(무엇|.*뜻|.*의미)/,
    /정의(는|란|:)/,
  ]

  if (patterns.some((p) => p.test(intro))) return true

  // 제목 키워드 + "는/은 ~이다/입니다" 형태도 정의문으로 인정
  if (titleWord && new RegExp(`${titleWord}(은|는)\\s+.{0,30}(이다|입니다|다\\.)`).test(intro)) {
    return true
  }

  return false
}

export function analyzeCitation(input: CitationInput): CitationAnalysisResult {
  const html = input.body ?? ''
  const plainText = stripTags(html)
  const breakdown: ScoreBreakdownItem[] = []

  const hasFaq = input.faqCount > 0
  breakdown.push({ label: 'FAQ 존재', points: hasFaq ? 20 : 0, passed: hasFaq })

  const hasSummary = !!input.geoSummary
  breakdown.push({ label: '요약 존재', points: hasSummary ? 15 : 0, passed: hasSummary })

  const hasTable = hasTableTag(html)
  breakdown.push({ label: '표 존재', points: hasTable ? 15 : 0, passed: hasTable })

  const hasList = hasListTag(html)
  breakdown.push({ label: '리스트 존재', points: hasList ? 15 : 0, passed: hasList })

  const hasExternalSource = hasExternalSourceLink(html)
  breakdown.push({ label: '신뢰 가능한 출처(외부링크) 존재', points: hasExternalSource ? 20 : 0, passed: hasExternalSource })

  const hasDefinition = hasDefinitionPattern(plainText, input.title)
  breakdown.push({ label: '정의문 존재(도입부)', points: hasDefinition ? 15 : 0, passed: hasDefinition })

  const citation_score = breakdown.reduce((sum, item) => sum + item.points, 0)

  return {
    citation_score,
    citation_breakdown: breakdown,
    stats: {
      hasTable,
      hasList,
      hasFaq,
      hasSummary,
      hasExternalSource,
      hasDefinition,
    },
  }
}