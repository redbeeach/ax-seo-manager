// lib/keywords/analyze.ts

// 한국어 형태소 분석기 없이 쓰는 간단한 규칙 기반 토크나이저.
// 완벽한 형태소 분리는 아니지만, SEO 키워드 비교 목적으로는 충분함.

const STOPWORDS = new Set([
  '그리고', '그러나', '하지만', '또한', '그래서', '때문에', '위해',
  '대한', '대해', '관련', '있는', '있다', '없는', '없다', '하는',
  '합니다', '입니다', '있습니다', '됩니다', '같은', '경우', '통해',
  '이것', '저것', '그것', '여기', '저기', '거기', '우리', '저희',
])

// 조사로 끝나는 경우 제거 (긴 조사부터 먼저 검사해야 함)
const PARTICLES = [
  '으로는', '에서는', '에게는', '까지는',
  '에서', '에게', '으로', '부터', '까지', '이라', '라는',
  '이다', '하다', '에는', '와의', '과의',
  '은', '는', '이', '가', '을', '를', '의', '에', '로', '와', '과', '도', '만',
]

function stripParticle(word: string): string {
  for (const p of PARTICLES) {
    if (word.length > p.length + 1 && word.endsWith(p)) {
      return word.slice(0, -p.length)
    }
  }
  return word
}

function tokenize(text: string): string[] {
  const raw = text
    .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
    .split(/[^가-힣a-zA-Z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2) // 한 글자는 노이즈가 많아 제외

  return raw
    .map(stripParticle)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
}

export interface KeywordAnalysis {
  primary: string[] // 제목에서 추출한 핵심 키워드
  secondary: { word: string; count: number }[] // 본문에 반복되지만 제목엔 없는 키워드
  missing: string[] // 제목 키워드인데 본문에 한 번도 안 나온 것 (가장 중요한 신호)
}

export function analyzeKeywords(title: string, body: string): KeywordAnalysis {
  const titleWords = Array.from(new Set(tokenize(title)))
  const bodyWords = tokenize(body)

  const bodyWordSet = new Set(bodyWords)

  const bodyFreq = new Map<string, number>()
  for (const w of bodyWords) {
    bodyFreq.set(w, (bodyFreq.get(w) ?? 0) + 1)
  }

  const primary = titleWords
  const missing = titleWords.filter((w) => !bodyWordSet.has(w))

  const secondary = Array.from(bodyFreq.entries())
    .filter(([word, count]) => !titleWords.includes(word) && count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }))

  return { primary, secondary, missing }
}