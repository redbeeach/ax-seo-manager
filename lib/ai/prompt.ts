export function buildOptimizePrompt(title: string, body: string) {
  return `당신은 SEO/AEO/GEO 최적화 전문가입니다. 아래 콘텐츠를 분석해서 최적화 요소를 생성하세요.

[제목]
${title}

[본문]
${body}

다음 항목을 생성하세요:
1. seo_title: 검색엔진 최적화된 제목 (30~60자)
2. meta_description: 메타 설명 (70~155자)
3. og_title: 오픈그래프 제목 (소셜 공유용)
4. og_description: 오픈그래프 설명
5. faq: 본문 기반 FAQ 3~5개 (question, answer 쌍의 배열)
6. ae_answer: AEO(Answer Engine Optimization)용 한 줄 핵심 답변 (질문에 바로 답하는 형태, 40자 이내)
7. geo_summary: GEO(Generative Engine Optimization)용 요약 - AI가 인용하기 좋은 형태로, 핵심 사실과 근거를 포함한 2~3문장
8. json_ld: schema.org Article 타입의 JSON-LD 객체 (headline, description, mainEntityOfPage 포함)

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요:

{
  "seo_title": "",
  "meta_description": "",
  "og_title": "",
  "og_description": "",
  "faq": [{"question": "", "answer": ""}],
  "ae_answer": "",
  "geo_summary": "",
  "json_ld": {}
}`
}