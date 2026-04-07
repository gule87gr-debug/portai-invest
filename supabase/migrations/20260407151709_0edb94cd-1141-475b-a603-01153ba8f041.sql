
-- Add trigger to prevent updating any column other than 'read' on notifications
CREATE OR REPLACE FUNCTION public.restrict_notification_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only allow changing the 'read' column
  IF NEW.from_user IS DISTINCT FROM OLD.from_user
     OR NEW.thread_id IS DISTINCT FROM OLD.thread_id
     OR NEW.thread_title IS DISTINCT FROM OLD.thread_title
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only the read column can be updated on notifications';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_notification_read_only_update
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.restrict_notification_update();
