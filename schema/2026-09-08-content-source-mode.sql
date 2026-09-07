ALTER TABLE contents ADD COLUMN IF NOT EXISTS content_source_mode text DEFAULT 'manual';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS manual_title text;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS manual_body text;

UPDATE contents
SET
  content_source_mode = COALESCE(content_source_mode, 'manual'),
  manual_title = COALESCE(manual_title, title),
  manual_body = COALESCE(manual_body, body);
