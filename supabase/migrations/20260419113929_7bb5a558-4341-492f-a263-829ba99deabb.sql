-- Price alerts table
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  asset_name TEXT NOT NULL DEFAULT '',
  asset_type TEXT NOT NULL DEFAULT 'stock',
  target_price NUMERIC NOT NULL CHECK (target_price > 0),
  direction TEXT NOT NULL CHECK (direction IN ('above','below')),
  triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON public.price_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON public.price_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.price_alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.price_alerts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_price_alerts_active ON public.price_alerts (ticker, triggered) WHERE triggered = false;
CREATE INDEX idx_price_alerts_user ON public.price_alerts (user_id, created_at DESC);

-- Allow service role to insert price-alert notifications
-- Extend send_notification to accept 'price_alert' type
CREATE OR REPLACE FUNCTION public.send_notification(_target_user_id uuid, _type text, _from_user text, _thread_id text, _thread_title text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service role bypass (for system-generated alerts)
  IF auth.role() = 'service_role' THEN
    INSERT INTO public.notifications (user_id, type, from_user, thread_id, thread_title)
    VALUES (_target_user_id, _type, _from_user, _thread_id, _thread_title);
    RETURN;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _target_user_id = auth.uid() THEN
    RETURN;
  END IF;
  IF _type NOT IN ('like', 'comment', 'reply', 'price_alert') THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;

  INSERT INTO public.notifications (user_id, type, from_user, thread_id, thread_title)
  VALUES (_target_user_id, _type, _from_user, _thread_id, _thread_title);
END;
$function$;