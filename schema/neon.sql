CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  content_source_mode text DEFAULT 'manual',
  manual_title text,
  manual_body text,
  seo_title text,
  meta_description text,
  og_title text,
  og_description text,
  faq_json jsonb,
  ae_answer text,
  geo_summary text,
  json_ld jsonb,
  seo_score int DEFAULT 0,
  aeo_score int DEFAULT 0,
  geo_score int DEFAULT 0,
  gb5_bo_table text,
  gb5_wr_id text,
  page_slug text UNIQUE,
  canonical_url text,
  robots_index boolean DEFAULT true,
  robots_follow boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS contents_gb5_source_idx
  ON contents (gb5_bo_table, gb5_wr_id)
  WHERE gb5_bo_table IS NOT NULL AND gb5_wr_id IS NOT NULL;

ALTER TABLE contents ADD COLUMN IF NOT EXISTS content_source_mode text DEFAULT 'manual';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS manual_title text;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS manual_body text;

CREATE TABLE IF NOT EXISTS content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  label text,
  seo_title text,
  meta_description text,
  og_title text,
  og_description text,
  faq_json jsonb,
  ae_answer text,
  geo_summary text,
  json_ld jsonb,
  seo_score int DEFAULT 0,
  aeo_score int DEFAULT 0,
  geo_score int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_versions_content_id_created_at_idx
  ON content_versions (content_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_live_analyses (
  content_id uuid PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
  url text,
  crawled_at timestamptz DEFAULT now(),
  content_score int DEFAULT 0,
  content_breakdown jsonb,
  content_stats jsonb
);

CREATE TABLE IF NOT EXISTS content_entity_analyses (
  content_id uuid PRIMARY KEY REFERENCES contents(id) ON DELETE CASCADE,
  analyzed_at timestamptz DEFAULT now(),
  is_live boolean DEFAULT false,
  topic text,
  entities jsonb,
  related_terms_coverage jsonb,
  covered_count int DEFAULT 0,
  total_count int DEFAULT 0,
  coverage_ratio double precision DEFAULT 0
);

CREATE TABLE IF NOT EXISTS content_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  recorded_at timestamptz DEFAULT now(),
  recorded_date date NOT NULL,
  overall_score int DEFAULT 0,
  seo_score int DEFAULT 0,
  aeo_score int DEFAULT 0,
  geo_score int DEFAULT 0,
  content_score int DEFAULT 0,
  citation_score int DEFAULT 0,
  eeat_score int DEFAULT 0,
  readability_score int DEFAULT 0,
  UNIQUE (content_id, recorded_date)
);

CREATE INDEX IF NOT EXISTS content_score_history_content_id_recorded_at_idx
  ON content_score_history (content_id, recorded_at ASC);
