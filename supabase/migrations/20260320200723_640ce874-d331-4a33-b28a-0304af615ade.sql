CREATE OR REPLACE FUNCTION public.check_username_available(desired_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN desired_username IS NULL OR length(trim(desired_username)) < 2 THEN false
    ELSE NOT EXISTS (
      SELECT 1
      FROM public.user_settings
      WHERE lower(trim(display_name)) = lower(trim(desired_username))
    )
  END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS user_settings_display_name_unique_idx
ON public.user_settings ((lower(trim(display_name))))
WHERE trim(display_name) <> '';