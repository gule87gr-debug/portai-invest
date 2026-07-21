REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;