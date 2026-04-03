
-- Drop the overly broad UPDATE policy
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- Create a restricted UPDATE policy
CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
