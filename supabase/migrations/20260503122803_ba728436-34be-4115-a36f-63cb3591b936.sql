
-- Likes table for analyzed articles (per-user toggleable)
CREATE TABLE IF NOT EXISTS public.article_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.analyzed_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_article_likes_article ON public.article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user ON public.article_likes(user_id);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.article_likes FOR SELECT USING (true);

CREATE POLICY "Users can like as themselves"
  ON public.article_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON public.article_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Toggle RPC: returns true if liked after the call, false if unliked.
-- Keeps analyzed_articles.vindicate_count in sync as the public like counter.
CREATE OR REPLACE FUNCTION public.toggle_article_like(_article_id UUID)
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

  SELECT id INTO existing FROM public.article_likes
   WHERE article_id = _article_id AND user_id = uid;

  IF existing IS NOT NULL THEN
    DELETE FROM public.article_likes WHERE id = existing;
    UPDATE public.analyzed_articles
       SET vindicate_count = GREATEST(0, vindicate_count - 1)
     WHERE id = _article_id;
    RETURN false;
  ELSE
    INSERT INTO public.article_likes (article_id, user_id) VALUES (_article_id, uid);
    UPDATE public.analyzed_articles
       SET vindicate_count = vindicate_count + 1
     WHERE id = _article_id;
    RETURN true;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.toggle_article_like(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_article_like(uuid) TO authenticated;
