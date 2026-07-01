interface ScoreBreakdownItem {
  label: string
  points: number
  maxPoints: number
  passed: boolean
}

export interface EeatAnalysisResult {
  eeat_score: number
  eeat_breakdown: ScoreBreakdownItem[]
  stats: {
    hasAuthor: boolean
    hasDatePublished: boolean
    hasDateModified: boolean
    hasPublisher: boolean
    hasDepth: boolean
    hasExternalSource: boolean
  }
}

interface EeatInput {
  json_ld: Record<string, unknown> | null
  body?: string | null
  created_at?: string | null
  updated_at?: string | null
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
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

export function analyzeEeat(input: EeatInput): EeatAnalysisResult {
  const breakdown: ScoreBreakdownItem[] = []
  const ld = input.json_ld as Record<string, unknown> | null

  // Experience: 작성자(author) 존재
  const hasAuthor =
    !!ld?.author &&
    (typeof (ld.author as Record<string, unknown>)?.name === 'string' ||
      typeof ld.author === 'string')
  breakdown.push({
    label: '작성자(author) 명시',
    points: hasAuthor ? 20 : 0,
    maxPoints: 20,
    passed: hasAuthor,
  })

  // Trustworthiness: 발행일
  const hasDatePublished = !!ld?.datePublished
  breakdown.push({
    label: '발행일(datePublished) 명시',
    points: hasDatePublished ? 15 : 0,
    maxPoints: 15,
    passed: hasDatePublished,
  })

  // Trustworthiness: 수정일
  const hasDateModified = !!ld?.dateModified
  breakdown.push({
    label: '수정일(dateModified) 명시',
    points: hasDateModified ? 15 : 0,
    maxPoints: 15,
    passed: hasDateModified,
  })

  // Authoritativeness: 발행처(publisher)
  const hasPublisher =
    !!ld?.publisher &&
    (typeof (ld.publisher as Record<string, unknown>)?.name === 'string' ||
      typeof ld.publisher === 'string')
  breakdown.push({
    label: '발행처(publisher) 명시',
    points: hasPublisher ? 15 : 0,
    maxPoints: 15,
    passed: hasPublisher,
  })

  // Experience: 충분한 깊이 (2000자 이상)
  const plainText = stripTags(input.body ?? '')
  const hasDepth = plainText.length >= 2000
  breakdown.push({
    label: '본문 깊이(2000자 이상)',
    points: hasDepth ? 20 : 0,
    maxPoints: 20,
    passed: hasDepth,
  })

  // Trustworthiness: 외부 출처 링크
  const hasExternalSource = hasExternalSourceLink(input.body ?? '')
  breakdown.push({
    label: '외부 출처 링크 존재',
    points: hasExternalSource ? 15 : 0,
    maxPoints: 15,
    passed: hasExternalSource,
  })

  const eeat_score = breakdown.reduce((sum, item) => sum + item.points, 0)

  return {
    eeat_score,
    eeat_breakdown: breakdown,
    stats: {
      hasAuthor,
      hasDatePublished,
      hasDateModified,
      hasPublisher,
      hasDepth,
      hasExternalSource,
    },
  }
}