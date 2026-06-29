import { analyzeContent, ContentAnalysisResult } from './content-analysis'

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
  body?: string | null
  canonical_url?: string | null
  robots_index?: boolean | null
  robots_follow?: boolean | null
  page_slug?: string | null
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
  content_score: number
  seo_breakdown: ScoreBreakdownItem[]
  aeo_breakdown: ScoreBreakdownItem[]
  geo_breakdown: ScoreBreakdownItem[]
  content_breakdown: ScoreBreakdownItem[]
  content_stats: ContentAnalysisResult['stats']
}

export function calculateScores(content: ScoreInput): ScoreResult {
  // ===== SEO 점수 =====
  const seoBreakdown: ScoreBreakdownItem[] = []

  const hasSeoTitle = !!content.seo_title
  seoBreakdown.push({ label: 'SEO Title 존재', points: hasSeoTitle ? 15 : 0, passed: hasSeoTitle })

  const seoTitleLenOk = !!content.seo_title && content.seo_title.length <= 60
  seoBreakdown.push({ label: 'SEO Title 60자 이하', points: seoTitleLenOk ? 15 : 0, passed: seoTitleLenOk })

  const hasMeta = !!content.meta_description
  seoBreakdown.push({ label: 'Meta Description 존재', points: hasMeta ? 15 : 0, passed: hasMeta })

  const metaLenOk = !!content.meta_description && content.meta_description.length <= 155
  seoBreakdown.push({ label: 'Meta Description 155자 이하', points: metaLenOk ? 15 : 0, passed: metaLenOk })

  const hasOg = !!content.og_title && !!content.og_description
  seoBreakdown.push({ label: 'OG 태그 존재', points: hasOg ? 15 : 0, passed: hasOg })

  // Canonical: canonical_url을 직접 지정했거나, page_slug가 있어서 자동 생성 가능하면 통과
  const hasCanonical = !!content.canonical_url || !!content.page_slug
  seoBreakdown.push({ label: 'Canonical URL 설정', points: hasCanonical ? 15 : 0, passed: hasCanonical })

  // robots: 명시적으로 false가 아니면(미설정 포함) 통과 — 기본값은 색인 허용
  const robotsOk = content.robots_index !== false && content.robots_follow !== false
  seoBreakdown.push({
    label: robotsOk ? 'robots index/follow 허용' : 'robots noindex 또는 nofollow 설정됨',
    points: robotsOk ? 10 : 0,
    passed: robotsOk,
  })

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

  // ===== Content 점수 (H태그/ALT/내부링크/글자수/표·목차) =====
  const contentAnalysis = analyzeContent(content.body ?? null)

  return {
    seo_score: seoScore,
    aeo_score: aeoScore,
    geo_score: geoScore,
    content_score: contentAnalysis.content_score,
    seo_breakdown: seoBreakdown,
    aeo_breakdown: aeoBreakdown,
    geo_breakdown: geoBreakdown,
    content_breakdown: contentAnalysis.content_breakdown,
    content_stats: contentAnalysis.stats,
  }
}