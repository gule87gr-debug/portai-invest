REVOKE EXECUTE ON FUNCTION public.is_admin_email(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_bypass(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_bypass(TEXT, TEXT, UUID) TO service_role;