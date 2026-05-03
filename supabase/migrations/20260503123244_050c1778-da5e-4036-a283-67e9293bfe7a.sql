
ALTER TABLE public.analyzed_articles
  ADD COLUMN IF NOT EXISTS pro_deep_dive JSONB;
