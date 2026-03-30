
-- Fix 1: Add INSERT policy on analysis_usage so users can only insert their own rows
CREATE POLICY "Users can insert own usage"
  ON public.analysis_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: Add Realtime channel authorization policy
CREATE POLICY "Users can only subscribe to own channel"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'notifications:' || auth.uid()::text
  );
