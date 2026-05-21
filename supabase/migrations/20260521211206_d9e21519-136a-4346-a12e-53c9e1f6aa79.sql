
-- Move premium columns to a separate restricted table
CREATE TABLE public.analyzed_articles_premium (
  article_id UUID PRIMARY KEY,
  hidden_angle TEXT NOT NULL DEFAULT '',
  pro_deep_dive JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copy existing premium data
INSERT INTO public.analyzed_articles_premium (article_id, hidden_angle, pro_deep_dive)
SELECT id, COALESCE(hidden_angle, ''), pro_deep_dive
FROM public.analyzed_articles;

-- Remove premium columns from the public table
ALTER TABLE public.analyzed_articles DROP COLUMN hidden_angle;
ALTER TABLE public.analyzed_articles DROP COLUMN pro_deep_dive;

-- Lock down premium table: enable RLS with no policies for client roles (service_role bypasses RLS)
ALTER TABLE public.analyzed_articles_premium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client select on premium"
  ON public.analyzed_articles_premium FOR SELECT TO authenticated, anon USING (false);
CREATE POLICY "No direct client insert on premium"
  ON public.analyzed_articles_premium FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No direct client update on premium"
  ON public.analyzed_articles_premium FOR UPDATE TO authenticated, anon USING (false);
CREATE POLICY "No direct client delete on premium"
  ON public.analyzed_articles_premium FOR DELETE TO authenticated, anon USING (false);
