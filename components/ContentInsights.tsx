'use client'

import { useState } from 'react'
import ScoreDashboard from './ScoreDashboard'
import EntitySemanticCard from './EntitySemanticCard'

interface ScoreBreakdownItem {
  label: string
  points: number
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

interface ContentInsightsProps {
  contentId: string
  seo: ScoreGroup
  aeo: ScoreGroup
  geo: ScoreGroup
  dbContent: ScoreGroup
  citation: ScoreGroup
  showBreakdown: boolean
  keywords: KeywordData
}

export default function ContentInsights({
  contentId,
  seo,
  aeo,
  geo,
  dbContent,
  citation,
  showBreakdown,
  keywords,
}: ContentInsightsProps) {
  const [liveSource, setLiveSource] = useState<{ title: string | null; body: string; url: string } | null>(
    null
  )

  return (
    <>
      <ScoreDashboard
        contentId={contentId}
        seo={seo}
        aeo={aeo}
        geo={geo}
        dbContent={dbContent}
        citation={citation}
        showBreakdown={showBreakdown}
        keywords={keywords}
        onCrawlResult={setLiveSource}
      />
      <EntitySemanticCard contentId={contentId} liveSource={liveSource} />
    </>
  )
}