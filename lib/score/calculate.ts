interface FaqItem {
  question: string
  answer: string
}

interface ScoreInput {
  seo_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  faq_json: FaqItem[] | null
  ae_answer: string | null
  geo_summary: string | null
  json_ld: Record<string, unknown> | null
}

interface ScoreBreakdownItem {
  label: string
  points: number
  passed: boolean
}

export interface ScoreResult {
  seo_score: number
  aeo_score: number
  geo_score: number
  seo_breakdown: ScoreBreakdownItem[]
  aeo_breakdown: ScoreBreakdownItem[]
  geo_breakdown: ScoreBreakdownItem[]
}

export function calculateScores(content: ScoreInput): ScoreResult {
  // ===== SEO 점수 =====
  const seoBreakdown: ScoreBreakdownItem[] = []

  const hasSeoTitle = !!content.seo_title
  seoBreakdown.push({ label: 'SEO Title 존재', points: hasSeoTitle ? 20 : 0, passed: hasSeoTitle })

  const seoTitleLenOk = !!content.seo_title && content.seo_title.length <= 60
  seoBreakdown.push({ label: 'SEO Title 60자 이하', points: seoTitleLenOk ? 20 : 0, passed: seoTitleLenOk })

  const hasMeta = !!content.meta_description
  seoBreakdown.push({ label: 'Meta Description 존재', points: hasMeta ? 20 : 0, passed: hasMeta })

  const metaLenOk = !!content.meta_description && content.meta_description.length <= 155
  seoBreakdown.push({ label: 'Meta Description 155자 이하', points: metaLenOk ? 20 : 0, passed: metaLenOk })

  const hasOg = !!content.og_title && !!content.og_description
  seoBreakdown.push({ label: 'OG 태그 존재', points: hasOg ? 20 : 0, passed: hasOg })

  const seoScore = seoBreakdown.reduce((sum, item) => sum + item.points, 0)

  // ===== AEO 점수 =====
  const aeoBreakdown: ScoreBreakdownItem[] = []

  const faqCount = content.faq_json?.length ?? 0
  const faqEnough = faqCount >= 3
  aeoBreakdown.push({ label: 'FAQ 3개 이상', points: faqEnough ? 40 : 0, passed: faqEnough })

  const hasAeAnswer = !!content.ae_answer
  aeoBreakdown.push({ label: '한 줄 답변 존재', points: hasAeAnswer ? 30 : 0, passed: hasAeAnswer })

  const hasQaStructure = faqCount > 0
  aeoBreakdown.push({ label: 'Q&A 구조 존재', points: hasQaStructure ? 30 : 0, passed: hasQaStructure })

  const aeoScore = aeoBreakdown.reduce((sum, item) => sum + item.points, 0)

  // ===== GEO 점수 =====
  const geoBreakdown: ScoreBreakdownItem[] = []

  const hasGeoSummary = !!content.geo_summary
  geoBreakdown.push({ label: '요약 존재', points: hasGeoSummary ? 30 : 0, passed: hasGeoSummary })

  const hasJsonLd = !!content.json_ld && Object.keys(content.json_ld).length > 0
  geoBreakdown.push({ label: 'JSON-LD 존재', points: hasJsonLd ? 40 : 0, passed: hasJsonLd })

  const hasExpertise = !!content.geo_summary && content.geo_summary.length >= 50
  geoBreakdown.push({ label: '전문성(요약 50자 이상)', points: hasExpertise ? 30 : 0, passed: hasExpertise })

  const geoScore = geoBreakdown.reduce((sum, item) => sum + item.points, 0)

  return {
    seo_score: seoScore,
    aeo_score: aeoScore,
    geo_score: geoScore,
    seo_breakdown: seoBreakdown,
    aeo_breakdown: aeoBreakdown,
    geo_breakdown: geoBreakdown,
  }
}