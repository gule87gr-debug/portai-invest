CREATE INDEX IF NOT EXISTS chat_usage_user_type_created_idx ON public.chat_usage(user_id, usage_type, created_at);
CREATE OR REPLACE FUNCTION public.reserve_daily_usage(p_user_id uuid, p_requirements jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item jsonb; used_count integer; limit_value integer; usage_key text;
BEGIN
 IF p_user_id IS NULL OR jsonb_typeof(p_requirements) <> 'array' OR jsonb_array_length(p_requirements) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Invalid usage request'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 92041));
 FOR item IN SELECT value FROM jsonb_array_elements(p_requirements) LOOP
  usage_key := item->>'type'; limit_value := (item->>'limit')::integer;
  IF usage_key NOT IN ('message','image_analysis','article_analysis','deep_dive') OR limit_value < 1 THEN RAISE EXCEPTION 'Invalid usage rule'; END IF;
  SELECT count(*) INTO used_count FROM public.chat_usage WHERE user_id=p_user_id AND usage_type=usage_key AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  IF used_count >= limit_value THEN RETURN false; END IF;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_requirements) LOOP
  INSERT INTO public.chat_usage(user_id,usage_type) VALUES(p_user_id,item->>'type');
 END LOOP;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_daily_usage(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_daily_usage(uuid,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.create_price_alert_checked(_user_id uuid, _tier text, _ticker text, _asset_name text, _asset_type text, _target_price numeric, _direction text) RETURNS public.price_alerts LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE result public.price_alerts;
BEGIN
 IF _tier IS NULL OR _tier NOT IN ('free','pro') THEN RAISE EXCEPTION 'Invalid tier'; END IF;
 IF _tier='free' THEN RAISE EXCEPTION 'PRICE_ALERTS_PAID_REQUIRED' USING ERRCODE='P0001'; END IF;
 IF _user_id IS NULL OR _target_price IS NULL OR _target_price<=0 OR _direction IS NULL OR _direction NOT IN ('above','below') OR _asset_type IS NULL OR _asset_type NOT IN ('stock','etf','crypto','index') OR _ticker IS NULL OR length(trim(_ticker)) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Invalid alert'; END IF;
 INSERT INTO public.price_alerts(user_id,ticker,asset_name,asset_type,target_price,direction,triggered) VALUES(_user_id,upper(trim(_ticker)),coalesce(_asset_name,''),_asset_type,_target_price,_direction,false) RETURNING * INTO result;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_price_alert_checked(uuid,text,text,text,text,numeric,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_price_alert_checked(uuid,text,text,text,text,numeric,text) TO service_role;