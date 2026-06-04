
REVOKE EXECUTE ON FUNCTION public.toggle_article_like(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_featured_like(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_trending_stocks(timestamptz) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_featured_like_counts() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_admin_bypass(text, text, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_email(text) FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.toggle_article_like(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_featured_like(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_stocks(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_like_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_bypass(text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_email(text) TO service_role;
