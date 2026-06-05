REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;