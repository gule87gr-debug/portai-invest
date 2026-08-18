CREATE TABLE public.article_analysis_cache (
  cache_key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_article_analysis_cache_url ON public.article_analysis_cache (url);
GRANT ALL ON public.article_analysis_cache TO service_role;
ALTER TABLE public.article_analysis_cache ENABLE ROW LEVEL SECURITY;