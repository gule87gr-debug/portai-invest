REVOKE INSERT, UPDATE ON public.price_alerts FROM anon, authenticated;
GRANT SELECT, DELETE ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;
CREATE INDEX IF NOT EXISTS price_alerts_active_user_idx ON public.price_alerts (user_id) WHERE triggered = false;
CREATE OR REPLACE FUNCTION public.create_price_alert_checked(_user_id uuid, _tier text, _ticker text, _asset_name text, _asset_type text, _target_price numeric, _direction text)
RETURNS public.price_alerts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE active_count integer; result public.price_alerts;
BEGIN
  IF _tier NOT IN ('free', 'plus', 'pro') OR _tier IS NULL THEN RAISE EXCEPTION 'Invalid tier'; END IF;
  IF _tier = 'free' THEN RAISE EXCEPTION 'PRICE_ALERTS_PAID_REQUIRED' USING ERRCODE = 'P0001'; END IF;
  IF _user_id IS NULL OR _target_price IS NULL OR _target_price <= 0 OR _direction NOT IN ('above', 'below') OR _asset_type NOT IN ('stock','etf','crypto','index') OR length(trim(_ticker)) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Invalid alert'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text, 83451));
  SELECT count(*) INTO active_count FROM public.price_alerts WHERE user_id = _user_id AND triggered = false;
  IF _tier = 'plus' AND active_count >= 5 THEN RAISE EXCEPTION 'PRICE_ALERT_LIMIT_REACHED' USING ERRCODE = 'P0001'; END IF;
  INSERT INTO public.price_alerts(user_id,ticker,asset_name,asset_type,target_price,direction,triggered)
  VALUES (_user_id, upper(trim(_ticker)), _asset_name, _asset_type, _target_price, _direction, false) RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_price_alert_checked(uuid,text,text,text,text,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_price_alert_checked(uuid,text,text,text,text,numeric,text) TO service_role;
COMMENT ON FUNCTION public.create_price_alert_checked(uuid,text,text,text,text,numeric,text) IS 'Service-only atomic alert creation. The authenticated edge function resolves tier; advisory lock serializes the five-active-alert Plus cap.';