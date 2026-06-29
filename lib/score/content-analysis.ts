interface ScoreBreakdownItem {
  label: string
  points: number
  passed: boolean
}

export interface ContentAnalysisResult {
  content_score: number
  content_breakdown: ScoreBreakdownItem[]
  stats: {
    h1Count: number
    h2Count: number
    h3Count: number
    imageCount: number
    imageMissingAltCount: number
    internalLinkCount: number
    externalLinkCount: number
    charCount: number
    hasTable: boolean
    hasToc: boolean
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function countTag(html: string, tag: string): number {
  const matches = html.match(new RegExp(`<${tag}[\\s>]`, 'gi'))
  return matches ? matches.length : 0
}

function getImageAltStats(html: string): { count: number; missingAlt: number } {
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? []
  let missingAlt = 0

  for (const tag of imgTags) {
    const altMatch = tag.match(/alt\s*=\s*["']([^"']*)["']/i)
    if (!altMatch || altMatch[1].trim().length === 0) {
      missingAlt += 1
    }
  }

  return { count: imgTags.length, missingAlt }
}

function getLinkStats(html: string): { internal: number; external: number } {
  const anchorTags = html.match(/<a\b[^>]*href\s*=\s*["'][^"']*["'][^>]*>/gi) ?? []
  let internal = 0
  let external = 0

  for (const tag of anchorTags) {
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']*)["']/i)
    if (!hrefMatch) continue
    const href = hrefMatch[1].trim()

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue
    }

    const isExternal = /^https?:\/\//i.test(href) && !href.includes('hby1126hh.mycafe24.com')
    if (isExternal) {
      external += 1
    } else {
      internal += 1
    }
  }

  return { internal, external }
}

function hasTocMarker(html: string): boolean {
  if (/id\s*=\s*["']toc["']/i.test(html)) return true
  if (/class\s*=\s*["'][^"']*toc[^"']*["']/i.test(html)) return true
  if (/목차/.test(stripTags(html).slice(0, 500))) return true
  return false
}

export function analyzeContent(bodyHtml: string | null, pageTitle?: string | null): ContentAnalysisResult {
  const html = bodyHtml ?? ''
  const breakdown: ScoreBreakdownItem[] = []

  const bodyH1Count = countTag(html, 'h1')
  const h2Count = countTag(html, 'h2')
  const h3Count = countTag(html, 'h3')

  // 페이지 템플릿이 title을 <h1>으로 자동 렌더링하는 경우가 많음 (예: <h1>{title}</h1>)
  // 그래서 title이 있으면 페이지 H1은 이미 충족된 것으로 간주하고,
  // 본문 안에 h1이 또 있으면 오히려 "H1 중복"으로 보고 감점한다.
  const pageHasTitleH1 = !!pageTitle
  const h1Count = bodyH1Count + (pageHasTitleH1 ? 1 : 0)

  const h1Exists = h1Count >= 1
  breakdown.push({ label: 'H1 존재', points: h1Exists ? 15 : 0, passed: h1Exists })

  const h1Single = h1Count === 1
  breakdown.push({
    label: h1Single
      ? 'H1 1개만 사용'
      : pageHasTitleH1 && bodyH1Count > 0
      ? `H1 중복 — 제목이 이미 H1인데 본문에 H1 ${bodyH1Count}개 추가됨`
      : 'H1 1개만 사용',
    points: h1Single ? 10 : 0,
    passed: h1Single,
  })

  const h2Enough = h2Count >= 2
  breakdown.push({ label: 'H2 2개 이상', points: h2Enough ? 15 : 0, passed: h2Enough })

  const { count: imageCount, missingAlt: imageMissingAltCount } = getImageAltStats(html)
  const altOk = imageCount === 0 || imageMissingAltCount === 0
  breakdown.push({
    label: imageCount === 0 ? '본문 이미지 없음 (해당없음 통과)' : `이미지 ALT 누락 0개 (총 ${imageCount}개)`,
    points: altOk ? 20 : 0,
    passed: altOk,
  })

  const { internal: internalLinkCount, external: externalLinkCount } = getLinkStats(html)
  const internalLinkOk = internalLinkCount >= 3
  breakdown.push({ label: '내부링크 3개 이상', points: internalLinkOk ? 15 : 0, passed: internalLinkOk })

  const plainText = stripTags(html)
  const charCount = plainText.length
  const lengthOk = charCount >= 1000
  breakdown.push({ label: '본문 1000자 이상', points: lengthOk ? 15 : 0, passed: lengthOk })

  const hasTable = /<table\b/i.test(html)
  const hasToc = hasTocMarker(html)
  const tableOrTocOk = hasTable || hasToc
  breakdown.push({
    label: '표 또는 목차 존재',
    points: tableOrTocOk ? 10 : 0,
    passed: tableOrTocOk,
  })

  const content_score = breakdown.reduce((sum, item) => sum + item.points, 0)

  return {
    content_score,
    content_breakdown: breakdown,
    stats: {
      h1Count,
      h2Count,
      h3Count,
      imageCount,
      imageMissingAltCount,
      internalLinkCount,
      externalLinkCount,
      charCount,
      hasTable,
      hasToc,
    },
  }
}