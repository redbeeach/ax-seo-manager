/**
 * 각 브레이크다운 항목의 label에 대한 툴팁 설명
 * label 문자열이 key로 시작하면(startsWith) 매칭 — 동적 label(이미지 개수 포함 등)도 커버
 */
const TIPS: { match: string; tip: string }[] = [
  // SEO
  { match: 'SEO Title 존재', tip: '검색 결과에 노출되는 제목입니다. 없으면 브라우저 탭 제목이 그대로 노출됩니다.' },
  { match: 'SEO Title 60자 이하', tip: 'Google은 약 60자 이후를 잘라냅니다. 핵심 키워드를 앞에 배치하세요.' },
  { match: 'Meta Description 존재', tip: '검색 결과 미리보기 텍스트입니다. 클릭률(CTR)에 직접 영향을 줍니다.' },
  { match: 'Meta Description 155자 이하', tip: '155자 이상은 검색 결과에서 잘립니다. 핵심 내용을 앞에 배치하세요.' },
  { match: 'OG 태그 존재', tip: 'SNS 공유 시 보이는 제목/설명입니다. 없으면 플랫폼이 임의로 내용을 가져갑니다.' },
  { match: 'Canonical URL 설정', tip: '중복 페이지가 있을 때 대표 URL을 검색엔진에 알려줍니다. 없으면 중복 콘텐츠 패널티 위험이 있습니다.' },
  { match: 'robots index/follow 허용', tip: '검색엔진이 이 페이지를 색인하고 링크를 따라가도록 허용된 상태입니다.' },
  { match: 'robots noindex', tip: '이 페이지는 검색엔진 색인에서 제외됩니다. 의도한 설정인지 확인하세요.' },

  // Content
  { match: 'H1 존재', tip: '페이지당 H1은 1개여야 합니다. 검색엔진이 이 페이지의 핵심 주제를 파악하는 데 사용합니다.' },
  { match: 'H1 1개만 사용', tip: 'H1이 2개 이상이면 검색엔진이 주제를 파악하기 어렵습니다. 1개로 줄이세요.' },
  { match: 'H1 중복', tip: '페이지 제목이 이미 H1인데 본문에도 H1이 있습니다. 본문의 H1을 H2로 변경하세요.' },
  { match: 'H2 2개 이상', tip: 'H2는 본문의 섹션 구분입니다. 2개 이상이면 콘텐츠 구조가 잘 잡힌 것으로 평가합니다.' },
  { match: '이미지 ALT', tip: '이미지 ALT 텍스트는 검색엔진이 이미지를 이해하는 유일한 수단입니다. 모든 이미지에 설명을 넣으세요.' },
  { match: '본문 이미지 없음', tip: '본문에 이미지가 없어 ALT 검사를 건너뜁니다. 이미지를 추가하면 체류 시간 향상에도 도움됩니다.' },
  { match: '내부링크 3개 이상', tip: '내부링크는 검색엔진이 사이트 구조를 파악하게 돕고, 사용자 체류 시간을 늘립니다.' },
  { match: '본문 1000자 이상', tip: 'Google은 얇은 콘텐츠를 낮게 평가합니다. 1000자 이상의 깊이 있는 내용을 작성하세요.' },
  { match: '표 또는 목차 존재', tip: '표와 목차는 AI/검색엔진이 구조화된 정보를 쉽게 파악하게 해줍니다.' },

  // AEO
  { match: 'FAQ 3개 이상', tip: 'FAQ는 Google 검색 결과의 "사람들이 자주 묻는 질문" 섹션에 노출될 수 있습니다.' },
  { match: '한 줄 답변 존재', tip: 'AI 검색엔진(ChatGPT, Perplexity 등)은 한 줄 요약을 직접 인용합니다.' },
  { match: 'Q&A 구조 존재', tip: 'Q&A 구조는 Answer Engine이 답변을 추출하기 가장 쉬운 형태입니다.' },

  // GEO
  { match: '요약 존재', tip: 'AI 생성 답변(GEO)에서 가장 많이 인용되는 부분입니다. 간결하고 명확한 요약이 핵심입니다.' },
  { match: 'JSON-LD 존재', tip: '구조화 데이터로, 검색엔진이 콘텐츠 유형(기사/FAQ/제품 등)을 정확히 이해하게 합니다.' },
  { match: '전문성(요약 50자 이상)', tip: '요약이 너무 짧으면 AI가 인용하기 어렵습니다. 핵심 정보를 50자 이상으로 기술하세요.' },

  // AI Citation
  { match: 'FAQ 존재', tip: 'ChatGPT/Perplexity는 FAQ 형태의 콘텐츠를 답변에 가장 많이 인용합니다.' },
  { match: '요약 존재', tip: 'AI는 글 전체보다 요약 문단을 먼저 인용합니다. 도입부에 핵심 요약을 넣으세요.' },
  { match: '표 존재', tip: 'AI는 비교/정리된 표를 그대로 인용하는 경향이 있습니다. 정보가 있다면 표로 정리하세요.' },
  { match: '리스트 존재', tip: 'AI는 순서 있는 목록(ol)과 항목 목록(ul)을 답변에 자주 인용합니다.' },
  { match: '신뢰 가능한 출처', tip: '외부 신뢰 사이트 링크가 있으면 AI가 이 글을 더 신뢰할 수 있는 출처로 판단합니다.' },
  { match: '정의문 존재', tip: '"~란", "~이란", "~는 무엇인가" 같은 정의문이 있으면 AI가 개념 답변에 인용합니다.' },
  { match: '출처 표기', tip: 'blockquote/cite 태그나 "출처:", "참고:" 텍스트가 있으면 AI가 이 글을 더 신뢰할 수 있는 자료로 평가합니다.' },
  { match: 'H2 섹션 구조', tip: 'H2가 2개 이상이면 AI가 섹션별로 내용을 이해하고 인용하기 쉽습니다.' },

  // E-E-A-T
  { match: '작성자(author) 명시', tip: 'Google E-E-A-T의 핵심. JSON-LD에 author.name이 있으면 "누가 썼는지"를 검색엔진이 신뢰합니다.' },
  { match: '발행일(datePublished) 명시', tip: 'JSON-LD에 datePublished가 있으면 콘텐츠의 최신성을 검색엔진이 정확히 파악합니다.' },
  { match: '수정일(dateModified) 명시', tip: '수정일이 있으면 콘텐츠가 지속적으로 관리되고 있음을 신호합니다. Google이 최신 콘텐츠를 우선 노출합니다.' },
  { match: '발행처(publisher) 명시', tip: 'JSON-LD에 publisher.name이 있으면 Authoritativeness(권위성)를 검색엔진에 명확히 전달합니다.' },
  { match: '본문 깊이(2000자 이상)', tip: '2000자 이상의 깊이 있는 콘텐츠는 Experience(경험)와 Expertise(전문성)를 나타냅니다.' },
  { match: '외부 출처 링크 존재', tip: '신뢰할 수 있는 외부 사이트 링크는 Trustworthiness(신뢰성)를 높이고 AI 인용 가능성을 높입니다.' },
]

export function getTip(label: string): string | null {
  const found = TIPS.find((t) => label.includes(t.match))
  return found ? found.tip : null
}