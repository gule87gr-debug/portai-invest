-- Server-backed likes for hardcoded featured Media Pulse articles.
CREATE TABLE public.featured_article_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  featured_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (featured_id, user_id)
);

CREATE INDEX idx_featured_article_likes_featured_id
  ON public.featured_article_likes (featured_id);

ALTER TABLE public.featured_article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured likes are viewable by everyone"
  ON public.featured_article_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like featured as themselves"
  ON public.featured_article_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own featured likes"
  ON public.featured_article_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Toggle a like on a featured article; returns the new liked state.
CREATE OR REPLACE FUNCTION public.toggle_featured_like(_featured_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  existing UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _featured_id IS NULL OR length(trim(_featured_id)) = 0 OR length(_featured_id) > 100 THEN
    RAISE EXCEPTION 'Invalid featured id';
  END IF;

  SELECT id INTO existing
  FROM public.featured_article_likes
  WHERE featured_id = _featured_id AND user_id = uid;

  IF existing IS NOT NULL THEN
    DELETE FROM public.featured_article_likes WHERE id = existing;
    RETURN false;
  ELSE
    INSERT INTO public.featured_article_likes (featured_id, user_id)
    VALUES (_featured_id, uid);
    RETURN true;
  END IF;
END;
$$;

-- Aggregate counts grouped by featured id (publicly callable).
CREATE OR REPLACE FUNCTION public.get_featured_like_counts()
RETURNS TABLE(featured_id TEXT, like_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT featured_id, COUNT(*)::BIGINT AS like_count
  FROM public.featured_article_likes
  GROUP BY featured_id;
$$;