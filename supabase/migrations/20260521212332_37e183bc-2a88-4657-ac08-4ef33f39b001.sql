
-- Restrict like visibility to the owning user (aggregate counts still come from
-- analyzed_articles.vindicate_count and get_featured_like_counts SECURITY DEFINER fn).
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.article_likes;
CREATE POLICY "Users can view their own article likes"
  ON public.article_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Featured likes are viewable by everyone" ON public.featured_article_likes;
CREATE POLICY "Users can view their own featured likes"
  ON public.featured_article_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
