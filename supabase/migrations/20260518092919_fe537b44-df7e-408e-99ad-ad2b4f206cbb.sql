-- Revoke public/anon EXECUTE on SECURITY DEFINER functions that should never
-- be callable from the client. These are invoked only from service-role
-- contexts (edge functions, queue processors, admin checks).

REVOKE EXECUTE ON FUNCTION public.is_admin_email(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_bypass(text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Lock down user-facing definer helpers to signed-in users only.
-- They all internally check auth.uid(), but anon should not even reach them.
REVOKE EXECUTE ON FUNCTION public.toggle_article_like(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vindicate_article(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.toggle_featured_like(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM PUBLIC, anon;

-- Read-only helpers used by the app remain available to authenticated users only.
REVOKE EXECUTE ON FUNCTION public.get_trending_stocks(timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_featured_like_counts() FROM PUBLIC, anon;
