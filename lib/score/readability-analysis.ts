interface ScoreBreakdownItem {
  label: string
  points: number
  maxPoints: number
  passed: boolean
}

export interface ReadabilityAnalysisResult {
  readability_score: number
  readability_breakdown: ScoreBreakdownItem[]
  stats: {
    avgSentenceLength: number
    sentenceCount: number
    charCount: number
    longSentenceCount: number
    paragraphCount: number
    avgParagraphLength: number
  }
}

interface ReadabilityInput {
  body: string | null
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSentences(text: string): string[] {
  // 한국어/영어 문장 구분: 마침표·느낌표·물음표 뒤 공백 or 줄바꿈 기준
  return text
    .split(/(?<=[.!?。！？])\s+|(?<=。)\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5) // 너무 짧은 토막 제외
}

function splitParagraphs(html: string): string[] {
  // p 태그 또는 br 2개 기준으로 단락 분리
  return html
    .split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>/gi)
    .map((p) => stripTags(p).trim())
    .filter((p) => p.length > 10)
}

export function analyzeReadability(input: ReadabilityInput): ReadabilityAnalysisResult {
  const html = input.body ?? ''
  const plainText = stripTags(html)
  const breakdown: ScoreBreakdownItem[] = []

  const sentences = splitSentences(plainText)
  const sentenceCount = sentences.length
  const charCount = plainText.length
  const avgSentenceLength =
    sentenceCount > 0
      ? Math.round(sentences.reduce((sum, s) => sum + s.length, 0) / sentenceCount)
      : 0

  // 긴 문장(80자 초과) 개수
  const longSentenceCount = sentences.filter((s) => s.length > 80).length

  // 단락 분리
  const paragraphs = splitParagraphs(html)
  const paragraphCount = paragraphs.length
  const avgParagraphLength =
    paragraphCount > 0
      ? Math.round(paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphCount)
      : 0

  // ① 평균 문장 길이: 20~50자면 최고, 너무 짧거나 길면 감점
  const sentLenOk = avgSentenceLength >= 15 && avgSentenceLength <= 50
  breakdown.push({
    label: `평균 문장 길이 ${avgSentenceLength}자 (적정 15~50자)`,
    points: sentLenOk ? 30 : avgSentenceLength > 0 ? 10 : 0,
    maxPoints: 30,
    passed: sentLenOk,
  })

  // ② 긴 문장(80자↑) 비율: 20% 미만이면 통과
  const longRatio = sentenceCount > 0 ? longSentenceCount / sentenceCount : 0
  const longRatioOk = longRatio < 0.2
  breakdown.push({
    label: `긴 문장(80자↑) 비율 ${Math.round(longRatio * 100)}% (20% 미만 권장)`,
    points: longRatioOk ? 25 : 0,
    maxPoints: 25,
    passed: longRatioOk,
  })

  // ③ 문장 수: 5개 이상이어야 분석 의미 있음
  const sentCountOk = sentenceCount >= 5
  breakdown.push({
    label: `문장 수 ${sentenceCount}개 (5개 이상)`,
    points: sentCountOk ? 20 : 0,
    maxPoints: 20,
    passed: sentCountOk,
  })

  // ④ 단락 수: 3개 이상이면 가독성 좋음
  const paraCountOk = paragraphCount >= 3
  breakdown.push({
    label: `단락 수 ${paragraphCount}개 (3개 이상 권장)`,
    points: paraCountOk ? 25 : 0,
    maxPoints: 25,
    passed: paraCountOk,
  })

  const readability_score = breakdown.reduce((sum, item) => sum + item.points, 0)

  return {
    readability_score,
    readability_breakdown: breakdown,
    stats: {
      avgSentenceLength,
      sentenceCount,
      charCount,
      longSentenceCount,
      paragraphCount,
      avgParagraphLength,
    },
  }
}