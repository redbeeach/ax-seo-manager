'use client'

import { useState } from 'react'
import ScoreDashboard from './ScoreDashboard'
import EntitySemanticCard from './EntitySemanticCard'
import HistoryChart from './HistoryChart'

interface ScoreBreakdownItem {
  label: string
  points: number
  maxPoints: number
  passed: boolean
}

interface ScoreGroup {
  score: number
  breakdown: ScoreBreakdownItem[]
}

interface KeywordData {
  primary: string[]
  secondary: { word: string; count: number }[]
  missing: string[]
}

interface LiveAnalysis {
  url: string
  crawled_at: string
  content_score: number
  content_breakdown: ScoreBreakdownItem[]
  content_stats: Record<string, unknown>
}

interface HistoryRecord {
  id: string
  recorded_at: string
  recorded_date: string
  overall_score: number | null
  seo_score: number | null
  aeo_score: number | null
  geo_score: number | null
  content_score: number | null
  citation_score: number | null
  eeat_score: number | null
  readability_score: number | null
}

interface ContentInsightsProps {
  contentId: string
  seo: ScoreGroup
  aeo: ScoreGroup
  geo: ScoreGroup
  dbContent: ScoreGroup
  citation: ScoreGroup
  eeat: ScoreGroup
  readability: ScoreGroup
  showBreakdown: boolean
  keywords: KeywordData
  initialLiveData: LiveAnalysis | null
  scoreHistory: HistoryRecord[]
}

export default function ContentInsights({
  contentId,
  seo,
  aeo,
  geo,
  dbContent,
  citation,
  eeat,
  readability,
  showBreakdown,
  keywords,
  initialLiveData,
  scoreHistory,
}: ContentInsightsProps) {
  const [liveSource, setLiveSource] = useState<{ title: string | null; body: string; url: string } | null>(
    null
  )

  // initialLiveData를 ScoreDashboard에 넘길 형태로 변환
  const initialCrawlResult = initialLiveData
    ? {
        url: initialLiveData.url,
        crawled_at: initialLiveData.crawled_at,
        page_title: null,
        title: null,
        body: '',
        content_score: initialLiveData.content_score,
        content_breakdown: initialLiveData.content_breakdown,
      }
    : null

  return (
    <>
      <ScoreDashboard
        contentId={contentId}
        seo={seo}
        aeo={aeo}
        geo={geo}
        dbContent={dbContent}
        citation={citation}
        eeat={eeat}
        readability={readability}
        showBreakdown={showBreakdown}
        keywords={keywords}
        onCrawlResult={setLiveSource}
        initialCrawlResult={initialCrawlResult}
      />
      <HistoryChart history={scoreHistory} />
      <EntitySemanticCard contentId={contentId} liveSource={liveSource} />
    </>
  )
}