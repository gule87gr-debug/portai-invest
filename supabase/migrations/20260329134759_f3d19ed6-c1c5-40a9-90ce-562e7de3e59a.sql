
CREATE OR REPLACE FUNCTION public.enforce_usage_date()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.used_date := CURRENT_DATE;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_usage_date
  BEFORE INSERT ON public.analysis_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_usage_date();
