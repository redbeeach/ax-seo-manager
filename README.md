# AX SEO Manager

> AI 기반 SEO · AEO · GEO 자동화 콘텐츠 관리 시스템

콘텐츠 작성 시 AI가 SEO/AEO/GEO 최적화 요소를 자동 생성하고 품질을 점수화하며, 실제 운영 중인 CMS(그누보드5)와 연동하여 메타데이터를 실시간으로 동기화하는 AX(AI Experience) 기반 관리자 시스템입니다.

## 🎯 프로젝트 배경

검색엔진(SEO)뿐 아니라 음성/AI 검색(AEO), 생성형 AI 인용(GEO)까지 대응해야 하는 콘텐츠 환경에서, 제목/메타설명/FAQ/JSON-LD를 일일이 수작업으로 작성하던 기존 워크플로우를 AI로 자동화했습니다.

본문 입력 → AI 분석 → SEO/AEO/GEO 요소 자동 생성 → 품질 점수화 → 운영 사이트에 자동 반영

## 🛠 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers |
| AI | OpenAI API (gpt-4o-mini) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| 외부 연동 | 그누보드5 (PHP) — REST API 기반 메타데이터 동기화 |

## ✨ 주요 기능

### 1. 콘텐츠 CRUD
제목/본문 작성, 목록/조회/수정/삭제

### 2. AI 최적화
본문 입력 시 AI가 아래 요소를 자동 생성합니다.
- SEO Title / Meta Description
- OG Title / OG Description
- FAQ (Q&A 3~5개)
- AEO용 한 줄 답변
- GEO용 요약 (생성형 AI 인용 대응)
- schema.org JSON-LD

### 3. 점수 시스템
SEO / AEO / GEO 항목별로 룰 기반 채점 + 근거(✓/✗ 체크리스트) 제공

| 항목 | 채점 기준 |
|---|---|
| SEO | Title 존재·길이, Meta Description 존재·길이, OG 태그 존재 |
| AEO | FAQ 3개 이상, 한 줄 답변 존재, Q&A 구조 |
| GEO | 요약 존재, JSON-LD 존재, 전문성(요약 길이) |

### 4. 검색결과 미리보기
- Google 검색결과 스타일
- 소셜 공유(OG) 카드 스타일
- AEO 음성/AI 검색 응답 스타일
- GEO 생성형 AI 인용 스타일

### 5. 대시보드
전체 콘텐츠 수, SEO/AEO/GEO 평균 점수

### 6. 그누보드5 실시간 연동
AX 관리자에서 생성한 메타데이터를 운영 중인 그누보드5 사이트에 **REST API로 동기화**하여, 게시글 view 페이지의 `<title>`, `<meta>`, JSON-LD가 자동으로 갱신됩니다.

[AX SEO Manager]                    [그누보드5 사이트]

contents 테이블                     head.sub.php

(gb5_bo_table, gb5_wr_id로 매칭) ←──  curl로 API 호출

↓

/api/public/meta?bo_table=...&wr_id=...

↓

{ seo_title, meta_description, og_title, og_description, json_ld }

별도 게시판/플랫폼 추가 연동 시에도 동일한 API 패턴으로 확장 가능합니다.

### 7. 자동 메타데이터 반영
콘텐츠 상세 페이지 자체에도 `generateMetadata`를 통해 AI 생성 결과가 `<head>`에 자동 반영되어, 수동 복붙 없이 SEO 태그가 적용됩니다.

## 📁 폴더 구조

app/

├── contents/          # 콘텐츠 CRUD 페이지

│   ├── new/

│   └── [id]/

│       └── edit/

├── dashboard/         # 통계 대시보드

├── preview/[id]/      # 검색결과/소셜/AEO/GEO 미리보기

└── api/

├── contents/      # CRUD API

├── ai/optimize/   # AI 최적화 API

└── public/meta/   # 외부 연동용 공개 API (그누보드5 등)
lib/

├── supabase/          # Supabase 클라이언트

├── ai/                # AI 클라이언트 & 프롬프트

└── score/             # 점수 계산 로직

## 🗄 데이터 모델

```sql
create table contents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  seo_title text,
  meta_description text,
  og_title text,
  og_description text,
  faq_json jsonb,
  ae_answer text,
  geo_summary text,
  json_ld jsonb,
  seo_score int default 0,
  aeo_score int default 0,
  geo_score int default 0,
  gb5_bo_table text,
  gb5_wr_id text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## 🚀 실행 방법

```bash
git clone https://github.com/redbeeach/ax-seo-manager.git
cd ax-seo-manager
npm install
```

`.env.local` 생성:

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=

```bash
npm run dev
```

## 📈 향후 계획 (Roadmap)

- [ ] 실제 OpenAI API 연동 전환 (현재 데모 mock 데이터 사용 중)
- [ ] 키워드 분석 (주요/보조/누락 키워드)
- [ ] 경쟁사 URL 분석 비교
- [ ] 워드프레스 등 추가 CMS 연동
- [ ] 예약 발행 기능

## 🔗 Live Demo

- [https://ax-seo-manager.vercel.app](https://ax-seo-manager.vercel.app)

