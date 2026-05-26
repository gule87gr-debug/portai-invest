REVOKE EXECUTE ON FUNCTION public.vindicate_article(uuid) FROM authenticated, anon, public;
DROP FUNCTION IF EXISTS public.vindicate_article(uuid);