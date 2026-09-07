DROP FUNCTION IF EXISTS public.check_username_available(text);
DROP INDEX IF EXISTS public.idx_user_settings_username;
ALTER TABLE public.user_settings DROP COLUMN IF EXISTS username;