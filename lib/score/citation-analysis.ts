interface ScoreBreakdownItem {
  label: string
  points: number
  maxPoints: number
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
    hasH2Structure: boolean
    hasCitationMark: boolean
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

function hasDefinitionPattern(plainText: string, title?: string | null): boolean {
  const intro = plainText.slice(0, 400)
  const titleWord = title ? title.trim().split(/\s+/)[0] : ''

  const patterns = [
    /[가-힣A-Za-z0-9]+(이)?란\s/,
    /[가-힣A-Za-z0-9]+(은|는)\s+(무엇|.*뜻|.*의미)/,
    /정의(는|란|:)/,
  ]

  if (patterns.some((p) => p.test(intro))) return true

  if (titleWord && new RegExp(`${titleWord}(은|는)\\s+.{0,30}(이다|입니다|다\\.)`).test(intro)) {
    return true
  }

  return false
}

function hasH2Structure(html: string): boolean {
  const h2Tags = html.match(/<h2[\s>]/gi)
  return h2Tags ? h2Tags.length >= 2 : false
}

// blockquote/cite 태그 또는 "출처:", "참고:", "Source:" 텍스트 패턴 체크
function hasCitationMark(html: string): boolean {
  if (/<blockquote\b|<cite\b/i.test(html)) return true
  const plain = stripTags(html)
  return /(출처|참고|Source|Reference)\s*[:：]/i.test(plain)
}

export function analyzeCitation(input: CitationInput): CitationAnalysisResult {
  const html = input.body ?? ''
  const plainText = stripTags(html)
  const breakdown: ScoreBreakdownItem[] = []

  // 총합 100pt: 15+15+10+10+15+10+10+15 = 100
  const hasFaq = input.faqCount > 0
  breakdown.push({ label: 'FAQ 존재', points: hasFaq ? 15 : 0, maxPoints: 15, passed: hasFaq })

  const hasSummary = !!input.geoSummary
  breakdown.push({ label: '요약 존재', points: hasSummary ? 15 : 0, maxPoints: 15, passed: hasSummary })

  const hasTable = hasTableTag(html)
  breakdown.push({ label: '표 존재', points: hasTable ? 10 : 0, maxPoints: 10, passed: hasTable })

  const hasList = hasListTag(html)
  breakdown.push({ label: '리스트 존재', points: hasList ? 10 : 0, maxPoints: 10, passed: hasList })

  const hasExternalSource = hasExternalSourceLink(html)
  breakdown.push({
    label: '신뢰 가능한 출처(외부링크) 존재',
    points: hasExternalSource ? 15 : 0,
    maxPoints: 15,
    passed: hasExternalSource,
  })

  const hasDefinition = hasDefinitionPattern(plainText, input.title)
  breakdown.push({
    label: '정의문 존재(도입부)',
    points: hasDefinition ? 10 : 0,
    maxPoints: 10,
    passed: hasDefinition,
  })

  const hasH2 = hasH2Structure(html)
  breakdown.push({
    label: 'H2 섹션 구조(2개 이상)',
    points: hasH2 ? 10 : 0,
    maxPoints: 10,
    passed: hasH2,
  })

  const hasCitation = hasCitationMark(html)
  breakdown.push({
    label: '출처 표기(blockquote/cite/출처:)',
    points: hasCitation ? 15 : 0,
    maxPoints: 15,
    passed: hasCitation,
  })

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
      hasH2Structure: hasH2,
      hasCitationMark: hasCitation,
    },
  }
}