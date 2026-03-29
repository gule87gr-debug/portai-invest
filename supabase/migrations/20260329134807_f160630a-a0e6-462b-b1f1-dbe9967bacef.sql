
CREATE OR REPLACE FUNCTION public.enforce_usage_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.used_date := CURRENT_DATE;
  RETURN NEW;
END;
$$;
