-- Restrict premium article columns from anon/authenticated SELECT.
-- Premium fields (hidden_angle, pro_deep_dive) must only be accessible
-- via an authenticated edge function that verifies subscription tier.
REVOKE SELECT ON public.analyzed_articles FROM anon, authenticated;
GRANT SELECT (id, url, source, title, bias_score, red_flag, summary,
              vindicate_count, view_count, created_at, submitted_by)
  ON public.analyzed_articles TO anon, authenticated;