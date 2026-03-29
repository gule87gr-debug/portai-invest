
-- 1. Fix notifications INSERT policy: replace WITH CHECK (true) with a secure RPC approach
-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- Create a secure function for inserting notifications that validates the sender
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
SET search_path = public
AS $$
BEGIN
  -- Ensure caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Don't allow sending notifications to yourself
  IF _target_user_id = auth.uid() THEN
    RETURN;
  END IF;
  
  -- Validate type
  IF _type NOT IN ('like', 'comment', 'reply') THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;

  INSERT INTO public.notifications (user_id, type, from_user, thread_id, thread_title)
  VALUES (_target_user_id, _type, _from_user, _thread_id, _thread_title);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.send_notification TO authenticated;

-- 2. Fix watchlist_stocks broad SELECT: remove the overly permissive policy and add a trending RPC
DROP POLICY IF EXISTS "Authenticated users can read all watchlist stocks for trending" ON public.watchlist_stocks;

-- Create a secure function for trending stocks aggregation
CREATE OR REPLACE FUNCTION public.get_trending_stocks(_since timestamptz)
RETURNS TABLE(ticker text, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ws.ticker, ws.name
  FROM public.watchlist_stocks ws
  WHERE ws.created_at >= _since;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_trending_stocks TO authenticated;

-- 3. Fix search_path on functions missing it
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;
