
ALTER TABLE public.user_settings ADD COLUMN username TEXT;
ALTER TABLE public.user_settings ADD COLUMN language TEXT NOT NULL DEFAULT 'en';

CREATE UNIQUE INDEX idx_user_settings_username ON public.user_settings (username) WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.check_username_available(desired_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_settings WHERE LOWER(username) = LOWER(desired_username)
  )
$$;
