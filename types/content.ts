export interface FaqItem {
  question: string
  answer: string
}

export interface Content {
  id: string
  title: string
  body: string
  seo_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  faq_json: FaqItem[] | null
  ae_answer: string | null
  geo_summary: string | null
  json_ld: Record<string, unknown> | null
  canonical_url: string | null
  robots_index: boolean
  robots_follow: boolean
  page_slug: string | null
  seo_score: number
  aeo_score: number
  geo_score: number
  created_at: string
  updated_at: string
}

export interface ContentInput {
  title: string
  body: string
}