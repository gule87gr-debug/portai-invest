
-- 1) Notifications: add INSERT policy (only via SECURITY DEFINER RPC / service role)
CREATE POLICY "No direct user inserts on notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 2) Watchlist stocks: add UPDATE policy scoped to owner
CREATE POLICY "Users can update own watchlist stocks"
ON public.watchlist_stocks
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.watchlists w
  WHERE w.id = watchlist_stocks.watchlist_id AND w.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.watchlists w
  WHERE w.id = watchlist_stocks.watchlist_id AND w.user_id = auth.uid()
));

-- 3) send_notification: derive from_user from caller, prevent sender spoofing
CREATE OR REPLACE FUNCTION public.send_notification(
  _target_user_id uuid,
  _type text,
  _from_user text,
  _thread_id text,
  _thread_title text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_from text;
BEGIN
  -- Service role bypass (system alerts, e.g. price alerts)
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
  IF _type NOT IN ('like', 'comment', 'reply') THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;

  -- Always derive sender identity from authenticated user; ignore client-supplied _from_user
  SELECT COALESCE(NULLIF(trim(display_name), ''), 'User')
    INTO v_from
  FROM public.user_settings
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_from IS NULL THEN
    v_from := 'User';
  END IF;

  INSERT INTO public.notifications (user_id, type, from_user, thread_id, thread_title)
  VALUES (
    _target_user_id,
    _type,
    v_from,
    left(coalesce(_thread_id, ''), 200),
    left(coalesce(_thread_title, ''), 300)
  );
END;
$function$;

-- 4) Restrict SECURITY DEFINER function execution
-- Public/anon must not be able to execute these
REVOKE EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vindicate_article(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_trending_stocks(timestamp with time zone) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- Re-grant for authenticated callers where appropriate
GRANT EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vindicate_article(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_stocks(timestamp with time zone) TO authenticated;
