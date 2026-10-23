CREATE TABLE public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX rate_limits_window_start_idx ON public.rate_limits (window_start);
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_window timestamptz; current_count integer;
BEGIN
  IF p_key IS NULL OR length(p_key) NOT BETWEEN 1 AND 512 OR p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;
  current_window := to_timestamp(floor(extract(epoch FROM statement_timestamp()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.rate_limits AS limits (key, window_start, count)
  VALUES (p_key, current_window, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET count = limits.count + 1
  RETURNING count INTO current_count;
  RETURN current_count <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;